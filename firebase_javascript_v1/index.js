const functions = require('firebase-functions');
const admin = require('firebase-admin');
// To avoid deployment errors, do not call admin.initializeApp() in your code

const {Storage} = require('@google-cloud/storage');
const {SessionsClient} = require('@google-cloud/dialogflow-cx').v3beta1;

credentials = {
  "type": "service_account",
  "project_id": "duet-ai-roadshow-415022",
  "private_key_id": "*",
  "private_key": "*",
  "client_email": "goog-sc-aiml-image-process-847@duet-ai-roadshow-415022.iam.gserviceaccount.com",
  "client_id": "108558154597929683744",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/goog-sc-aiml-image-process-847%40duet-ai-roadshow-415022.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}

/**
 * Example for regional endpoint:
 *   const location = 'us-central1'
 *   const client = new SessionsClient({apiEndpoint: 'us-central1-dialogflow.googleapis.com', credentials: credentials})
 */
const client = new SessionsClient({apiEndpoint: 'us-central1-dialogflow.googleapis.com'});

// onCall(async (data, context)
exports.getTrivia = functions.region('us-central1').runWith({memory: '128MB'}).https.onRequest(async (req, res) => {
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
    credentials
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
