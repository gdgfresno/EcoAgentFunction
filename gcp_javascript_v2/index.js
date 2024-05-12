const functions = require('@google-cloud/functions-framework');
const {Storage} = require('@google-cloud/storage');
const {SessionsClient} = require('@google-cloud/dialogflow-cx').v3beta1;

/**
 * Example for regional endpoint:
 *   const location = 'us-central1'
 *   const client = new SessionsClient({apiEndpoint: 'us-central1-dialogflow.googleapis.com'})
 */
// https://stackoverflow.com/questions/50545943/dialogflow-easy-way-for-authorization
const client = new SessionsClient({keyFilename: 'key.json', apiEndpoint: 'us-central1-dialogflow.googleapis.com'});

functions.http('getTrivia', async (req, res) => {
  // CORS handling
  res.set('Access-Control-Allow-Origin', "*");
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader(
      "Access-Control-Allow-Headers",
      "X-Requested-With,content-type"
  );

  let token = req.body.token || req.query.token;
  let slToken = process.env.SL_TOKEN || "*";
  if (token !== slToken) {
    res.status(401).send("Invalid token");
    return;
  }

  let projectId = process.env.PROJECT_ID || "duet-ai-roadshow-415022";

  // GOOGLE_APPLICATION_CREDENTIALS ???
  // https://stackoverflow.com/questions/52635632/setting-google-application-credentials-in-current-shell-session-via-node-js
  const storage = new Storage({
    projectId: projectId,
    keyFilename: 'key.json'
  });

  let locationId = req.body.location_id || req.query.location_id || process.env.LOCATION_ID || 'us-central1';
  let agentId = req.body.agent_id || req.query.agent_id || process.env.AGENT_ID;
  let languageCode = req.body.language_code || req.query.language_code || process.env.LANGUAGE_CODE || 'en'
  let sessionId = req.body.session_id || req.query.session_id;
  const sessionPath = client.projectLocationAgentSessionPath(
    projectId,
    locationId,
    agentId,
    sessionId
  );

  let query = req.body.query || req.query.query || "";

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: query,
      },
      languageCode,
    },
  };
  const [response] = await client.detectIntent(request);
  let fullResponse = "";
  for (const message of response.queryResult.responseMessages) {
    if (message.text) {
      fullResponse += message.text.text;
    }
  }

  res.json(JSON.parse(fullResponse));
});
