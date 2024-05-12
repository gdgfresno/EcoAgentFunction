const functions = require("firebase-functions/v1");
const {Storage} = require("@google-cloud/storage");
const {SessionsClient} = require("@google-cloud/dialogflow-cx").v3beta1;

/**
 * Example for regional endpoint:
 *   const location = "us-central1"
 *   const client = new SessionsClient({apiEndpoint: "us-central1-dialogflow.googleapis.com", credentials: credentials})
 */
const client = new SessionsClient({apiEndpoint: "us-central1-dialogflow.googleapis.com", keyFilename: "key.json"});

// onCall(async (data, context)
exports.getTrivia = functions.region("us-central1").runWith({memory: "128MB"}).https.onRequest(async (req, res) => {
  // CORS handling
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST");
  res.setHeader(
      "Access-Control-Allow-Headers",
      "X-Requested-With,content-type"
  );

  const token = req.body.token || req.query.token;
  const slToken = process.env.SL_TOKEN || "*";
  if (token !== slToken) {
    res.status(401).send("Invalid token");
    return;
  }

  const projectId = process.env.PROJECT_ID || "duet-ai-roadshow-415022";

  // GOOGLE_APPLICATION_CREDENTIALS ???
  // https://stackoverflow.com/questions/52635632/setting-google-application-credentials-in-current-shell-session-via-node-js
  const storage = new Storage({
    projectId: projectId,
    keyFilename: "key.json"
  });

  const locationId = req.body.location_id || req.query.location_id || process.env.LOCATION_ID || "us-central1";
  const agentId = req.body.agent_id || req.query.agent_id || process.env.AGENT_ID;
  const languageCode = req.body.language_code || req.query.language_code || process.env.LANGUAGE_CODE || "en";
  const sessionId = req.body.session_id || req.query.session_id;
  const sessionPath = client.projectLocationAgentSessionPath(
    projectId,
    locationId,
    agentId,
    sessionId
  );

  const query = req.body.query || req.query.query || "";

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
