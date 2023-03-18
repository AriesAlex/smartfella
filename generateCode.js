const { Configuration, OpenAIApi } = require('openai')

async function generateCode(prompt, apiKey) {
  const openai = new OpenAIApi(new Configuration({ apiKey }))
  const response = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt,
    temperature: 0.7,
    max_tokens: 1024,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  })
  return response.data.choices[0].text.trim()
}

module.exports = generateCode
