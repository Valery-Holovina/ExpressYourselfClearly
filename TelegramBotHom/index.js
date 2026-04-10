//npm init -y
//npm i telegraf
// npm i openai

const { Telegraf } = require('telegraf')
const { message } = require('telegraf/filters')
const OpenAI = require('openai')

const openai = new OpenAI({
    apiKey: "token"
});

const BOT_TOKEN = "token"

const bot = new Telegraf(BOT_TOKEN);

// Basic Commands
bot.start((ctx) => ctx.reply(`Hi, ${ctx.message.chat.first_name} ✨`))
bot.help((ctx) => ctx.reply(
`This bot is made to help you express yourself clearly 🌳

<b>Commands:</b>
1. <b>/dictionary yourWord</b> - get explanation from dictionary
2. <b>/ai yourWord</b> - get short AI explanation (limited)
3. <b>/quote</b> - get random quote 

<i>(Note: write / before every command)</i>`,
{ parse_mode: 'HTML' }
));

bot.hears('Bye',(ctx) => {
    ctx.reply('Have a wonderful day 😉')
})

bot.hears('Thank you', (ctx) =>{
    ctx.reply('You are welcome 🤗')
})



// AI usage
async function WordsExplain(userWord) {
    try{
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "user",
                content: `Explain word ${userWord} in simple English`
            }],
            max_tokens: 100,
        });
        return response.choices[0].message.content.trim();
    }catch (error){
          if (error.status === 429) return "Free quota exceeded! Please wait until next month.";
          console.error(error);
        return "Please try again later..."
    }

    
}


//Fetch data from Dictionary
async function ExplainDict(userWord) {
    const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${userWord}`
);
    if(!response.ok){
        throw new Error(`HTTP ${response.status}`)
    }else{
        return response.json();
    }
    
}

//Fetch Quotes
async function GetQuote(){
    const response = await fetch(`https://api.viewbits.com/v1/zenquotes?mode=random`)

    if(!response.ok){
         throw new Error(`HTTP ${response.status}`)
    }else{
        return response.json();
    }
}


//DICTIONARY command
bot.command('dictionary', async(ctx) =>{

    const userText = ctx.message.text.split(' ').slice(1).join(' ');

     if (!userText) {
        return ctx.reply("Please enter a word after /dictionary");
    }

    ctx.reply("Explaining the word...")

    try{
        const data = await ExplainDict(userText);

    
        const answers = data.flatMap(item =>
            item.meanings.flatMap(meaning =>
                meaning.definitions.map(def => {
                    let example = def.example ? `\nExample: ${def.example}` : "";
                    return `(${meaning.partOfSpeech}) ${def.definition}${example}`;
                })
            )
        );

        const finalAnswer = answers.join('\n\n--------------\n\n');
        await ctx.reply(finalAnswer || "No definitions found.");
  
    }catch (error){
        console.error(error)
        await ctx.reply("Error dictionary!")
    }
   
})


//AI command
bot.command('ai', async(ctx) =>{

    const userText = ctx.message.text.split(' ').slice(1).join(' ');

     if (!userText) {
        return ctx.reply("Please enter a word after /ai");
    }

    ctx.reply("Explaining the word...")

    const explanation = await WordsExplain(userText);
    ctx.reply(explanation);
})


// QUOTE command
bot.command('quote', async (ctx) =>{
    try{

     const quoteG = await GetQuote();
     const quote = quoteG.map( quote1=> {
        return `${quote1.q}`
     })
      ctx.reply(quote)
    } catch (error){
        console.error(error)
         ctx.reply("Error quotes")
    }
       
})


bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))