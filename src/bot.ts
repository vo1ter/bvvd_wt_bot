import { Telegraf } from 'telegraf'
import { getPetByUser, createPet, createUser, getUserByTelegramId, getPetByTelegramUser } from './db'
require('dotenv').config()

if (
	!process.env.TELEGRAM_BOT_TOKEN
) {
	throw new Error('TELEGRAM_BOT_TOKEN is not defined in environment variables')
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)

// const petCommands = ["/name", "/feed"];

// bot.use(async (ctx, next) => {
// 	if(ctx.message && "text" in ctx.message) {
// 		if(!ctx.message.text.startsWith("/")) return;

// 		const userResult = await getUserByTelegramId(ctx.message.from.id);

// 		ctx.message.entities?.map(async entity => {
// 			if(entity.type === "bot_command" && ctx.message && "text" in ctx.message) {
// 				const command = ctx.message.text.substring(entity.offset, entity.offset + entity.length);
// 				if(command != "/start") {
// 					if(!userResult) {
// 						sendErrorMessage(ctx.message.chat.id, "You are not registered in our system. Please use command /start to register.");
// 						return;
// 					}
// 				}
// 				if(petCommands.includes(command)) {
// 					const userResult = await getUserByTelegramId(ctx.message.from.id);

// 					if(!userResult) {
// 						sendErrorMessage(ctx.message.chat.id, "You are not registered in our system. Please use command /start to register.");
// 						return;
// 					}

// 					const petQuery = await getPetByUser(userResult.id);

// 					if(!petQuery) {
// 						createPet(userResult.id);
// 					}
// 				}
// 			}
// 		});
// 	}

// 	await next();
// })

bot.start(async (ctx) => {
	const user = ctx.message.from.id;
	const queryResult = await getUserByTelegramId(user)

	if (!queryResult) {
		ctx.replyWithMarkdownV2(`You are not registered in our system\\. Please press the button below to register\\*\\.\n\n\\* \\- by registering with us you are agreeing with our [ToS](https\:\/\/bvvd\.femboy\.fyi\/tos)`, {
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

	if(!user) return sendErrorMessage(ctx.message.chat.id, "We couldn't find your profile.")

	try {
		const pet = await getPetByTelegramUser(telegramUser);

		if(!pet) return sendErrorMessage(ctx.message.chat.id, "Your BVVD doesn't exist! Please create a new one using command /create")

		ctx.reply(`${pet.name}`)
	}
	catch(error) {
		console.error(error)
	}
})

bot.command("create", async (ctx) => {
	const telegramUser = ctx.message.from.id;
	const user = await getUserByTelegramId(telegramUser);

	if(!user) return sendErrorMessage(ctx.message.chat.id, "We couldn't find your profile.")

	const pet = await getPetByTelegramUser(telegramUser);
	if(pet) return sendErrorMessage(ctx.message.chat.id, "You already have a BVVD!")

	const create = await createPet(user.id, (ctx.args[0]) ? ctx.args[0] : `${ctx.message.from.first_name}'s BVVD`);
	if(!create) return sendErrorMessage(ctx.message.chat.id, "We couldn't create your BVVD for some reason. Pls contact us")

	else return await ctx.reply("Your BVVD was created succesfully")
})

bot.action("accept_tos", async (ctx) => {
	const user = ctx.from.id;
	const queryResult = await getUserByTelegramId(user)

	if (queryResult) {
		return sendErrorMessage(ctx.callbackQuery.message?.chat.id!, "You are already registered in our system.");
	}

	const insertResult = await createUser(user);

	if (!insertResult) {
		return sendErrorMessage(ctx.callbackQuery.message?.chat.id!, "Failed to register. Please try again later.");
	}

	bot.telegram.editMessageText(ctx.callbackQuery.message?.chat.id, ctx.callbackQuery.message?.message_id, undefined, `✅ You have been registered successfully!`,)

	setInterval(() => {
		bot.telegram.deleteMessage(ctx.callbackQuery.message?.chat.id!, ctx.callbackQuery.message?.message_id!);
	}, 5000)
})

export async function sendErrorMessage(chatId: number, text: string) {
	const errorMessage = await bot.telegram.sendMessage(chatId, `❌ ${text}`)
	setInterval(() => {
		bot.telegram.deleteMessage(errorMessage.chat.id, errorMessage.message_id);
	}, 5000)
}

async function start() {
	await bot.launch()
	console.log('Bot started')
}

start().catch(err => {
	console.error('Failed to start:', err)
	process.exit(1)
})

process.once('SIGINT', async () => {
	await bot.stop('SIGINT')
})
process.once('SIGTERM', async () => {
	await bot.stop('SIGTERM')
})