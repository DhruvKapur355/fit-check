// Trusted sources the local AI uses to VERIFY each Dialogflow answer and to add
// detail (with [n] citations). The AI is told to use nothing outside these excerpts,
// and the code rejects any polished answer that adds numbers, links, or product
// names that aren't in the Dialogflow answer or these excerpts.
//
// Key = the intent's display name in Dialogflow, exactly as it appears in the console.
// Paste a short, accurate excerpt from each page (a few sentences is ideal).
//
// You can ALSO attach sources directly in Dialogflow by adding a Custom Payload
// to an intent's response:
//   { "sources": [ { "title": "...", "url": "https://...", "excerpt": "..." } ] }
// and turn polishing off for a specific intent with:
//   { "polish": false }

export default {
  // 'charging.home': [
  //   {
  //     title: 'Charging at home - U.S. Department of Energy',
  //     url: 'https://afdc.energy.gov/fuels/electricity-charging-home',
  //     excerpt: 'Paste 2-4 sentences copied from the page here.',
  //   },
  // ],
};
