import { getPetByTelegramUser, createPet, renamePet } from 'lib/pet'
import { getUserByTelegramId, createUser } from 'lib/user'
import { Telegraf } from 'telegraf'

if (!Bun.env.TELEGRAM_BOT_TOKEN) {
	throw new Error('TELEGRAM_BOT_TOKEN is not defined in environment variables')
}

const bot = new Telegraf(Bun.env.TELEGRAM_BOT_TOKEN)

bot.start(async (ctx) => {
	const user = ctx.message.from.id;
	const queryResult = await getUserByTelegramId(user)

	if (!queryResult) {
		ctx.replyWithMarkdownV2(`You are not registered in our system\\. Please press the button below to register\\*\\.\n\n\\* \\- by registering with us you are agreeing with our [ToS](https://bvvd\\.femboy\\.fyi/tos)`, {
			reply_markup: {
				inline_keyboard: [
					[{ text: "✅ Register", callback_data: "accept_tos" }]
				]
			}
		})
	}
})

bot.command("help", async (ctx) => {
	ctx.reply(`Available commands:
	/start - register
	/create <name?> - create your BVVD (<name?> is an optional variable)
	/name - get name of your BVVD
	/name <string> - give your BVVD a new name
	/feed - feed your BVVD
	/bvvd - check your BVVD stats
	`);
});

bot.command("bvvd", async (ctx) => {
	const telegramUser = ctx.message.from.id;

	const user = await getUserByTelegramId(telegramUser);
	if (!user) return sendErrorMessage(ctx.message.chat.id, "We couldn't find your profile.")

	try {
		const pet = await getPetByTelegramUser(telegramUser);
		if (!pet) return sendErrorMessage(ctx.message.chat.id, "Your BVVD doesn't exist! Please create a new one using command /create")

		ctx.reply(`${pet.name}`)
	}
	catch (error) {
		console.error(error)
	}
})

bot.command("create", async (ctx) => {
	const telegramUser = ctx.message.from.id;
	const user = await getUserByTelegramId(telegramUser);
	if (!user) return sendErrorMessage(ctx.message.chat.id, "We couldn't find your profile.")

	const pet = await getPetByTelegramUser(telegramUser);
	if (pet) return sendErrorMessage(ctx.message.chat.id, "You already have a BVVD!")

	const create = await createPet(user.id, (ctx.args[0]) ? ctx.args[0] : `${ctx.message.from.first_name}'s BVVD`);
	if (create) {return await ctx.reply("Your BVVD was created succesfully")}

	else return sendErrorMessage(ctx.message.chat.id, "We couldn't create your BVVD for some reason. Pls contact us")
})

bot.command("name", async (ctx) => {
	const telegramUser = ctx.message.from.id;
	const user = await getUserByTelegramId(telegramUser);
	if (!user) return sendErrorMessage(ctx.message.chat.id, "We couldn't find your profile.")
	
	const pet = await getPetByTelegramUser(telegramUser);
	if (!pet) return sendErrorMessage(ctx.message.chat.id, "Your BVVD doesn't exist! Please create a new one using command /create")
	
	if(!ctx.args[0]) return ctx.reply(`Your BVVD's name is '${pet.name}'`);
	
	try {
		await renamePet(pet.id, ctx.args[0]);
		return ctx.reply(`Your BVVD's new name is '${ctx.args[0]}'`);
	}
	catch (error: any) {
		console.log(`Failed to update pet's name: ${error.message}`);
		return sendErrorMessage(ctx.message.chat.id, "We couldn't update your BVVD for some reason. Pls contact us");
	}
})

bot.action("accept_tos", async (ctx) => {
	const user = ctx.from.id;
	const queryResult = await getUserByTelegramId(user);

	if (queryResult) {
		return sendErrorMessage(ctx.callbackQuery.message?.chat.id!, "You are already registered in our system.");
	}

	const insertResult = await createUser(user);
	if (!insertResult) {
		return sendErrorMessage(ctx.callbackQuery.message?.chat.id!, "Failed to register. Please try again later.");
	}

	await bot.telegram.editMessageText(
		ctx.callbackQuery.message?.chat.id,
		ctx.callbackQuery.message?.message_id,
		undefined,
		`✅ You have been registered successfully!`
	);

	setTimeout(async () => {
		try {
			await bot.telegram.deleteMessage(ctx.callbackQuery.message?.chat.id!, ctx.callbackQuery.message?.message_id!);
		} catch (error: any) {
			console.log(`Could not delete registration message: ${error.message}`);
		}
	}, 5000);
});

export async function sendErrorMessage(chatId: number, text: string) {
	const errorMessage = await bot.telegram.sendMessage(chatId, `❌ ${text}`);

	setTimeout(async () => {
		try {
			await bot.telegram.deleteMessage(errorMessage.chat.id, errorMessage.message_id);
		} catch (error: any) {
			console.log(`Could not delete error message: ${error.message}`);
		}
	}, 5000);
}

async function start() {
	console.log('Bot started')
	await bot.launch()
}

start().catch(err => {
	console.error('Failed to start:', err)
	process.exit(1)
})

process.once('SIGINT', async () => {
	bot.stop('SIGINT')
})
process.once('SIGTERM', async () => {
	bot.stop('SIGTERM')
})