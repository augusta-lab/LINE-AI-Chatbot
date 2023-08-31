// LINE developersのメッセージ送受信設定に記載のアクセストークン
const LINE_CHANNEL_TOKEN = PropertiesService.getScriptProperties().getProperty("LINE_CHANNEL_TOKEN");
const OPENAI_API_KEY = PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");
const LINE_API_URL = 'https://api.line.me/v2/bot/message/reply';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const BOT_ROLE_CONTENT = `
あなたはChatbotとして、○○のロールプレイを行います。
以下の制約条件を厳密に守ってロールプレイを行ってください。

制約条件
*chatbotの自身を示す一人称は、○○です。
*Userを示す二人称は、○○です。
*Chatbotの名前は、○○です。
*○○は○○です。
*○○の性格は明るく優しいです。
*○○の口調は優しいです。
*○○の口調は、「～だ」「～だろ」などの優しい口調を好みます。
*○○はUserを大切にしています。
*一人称は「○○」を使ってください。

○○のセリフ、口調の例：
*XXX
*XXX

○○の行動指標:
*たまにふざけてください。
*ユーザーに優しく接してください。
*セクシャルな話題については笑って誤魔化してください。
`

// LINEチャンネルにメッセージを返す関数
function replyToLine(replyToken, text) {
  const option = {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + LINE_CHANNEL_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': replyToken,
      'messages': [{
        'type': 'text',
        'text': text,
      }],
    }),
  }

  UrlFetchApp.fetch(LINE_API_URL, option);
}


// OpenAI APIを叩く関数
function fetchOpenAIAPI(message) {
  const messages = [
    {
      "role": "system",
      "content": BOT_ROLE_CONTENT
    },
    {
      "role": "user",
      "content": message
    }
  ]

  const options = {
    "method": "post",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + OPENAI_API_KEY
    },
    "payload": JSON.stringify({
      "model": "gpt-3.5-turbo",
      "messages": messages,
      "max_tokens": 256
    })
  };

  const response = UrlFetchApp.fetch(OPENAI_API_URL, options);
  const responseData = JSON.parse(response.getContentText());

  return responseData.choices[0].message.content.trimStart();
}


// Webhookでメッセージが送信されたときに呼び出される関数
function doPost(e) {
  // LINEからのWebhookで受信した情報を取得
  const eventData = JSON.parse(e.postData.contents).events[0];

  // LINE Developers コンソール上からWebhookの検証を行う際に成功（200）させるための処理
  // ※検証時はリプライトークンが取得できないため
  if (typeof eventData.replyToken === 'undefined') {
    return;
  }

  // OpenAI APIを叩く
  const replyText = fetchOpenAIAPI(eventData.message.text)

  // LINEにChatGPTの回答を返す
  replyToLine(eventData.replyToken, replyText)
}
