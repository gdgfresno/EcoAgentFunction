import functions_framework
import functools
import os
import uuid

from google.cloud.dialogflowcx_v3beta1.services.agents import AgentsClient
from google.cloud.dialogflowcx_v3beta1.services.sessions import SessionsClient
from google.cloud.dialogflowcx_v3beta1.types import session

@functools.lru_cache
def get_session_client(agent_path="", location_id=""):
    client_options = None
    agent_components = AgentsClient.parse_agent_path(agent_path)
    location_id = agent_components["location"]
    if location_id != "global":
        api_endpoint = f"{location_id}-dialogflow.googleapis.com:443"
        print(f"API Endpoint: {api_endpoint}\n")
        client_options = {"api_endpoint": api_endpoint}

    session_client = SessionsClient(client_options=client_options)
    return session_client

@functions_framework.http
def eco_agent(request):
    request_json = request.get_json(silent=True)
    request_args = request.args

    if request_json and 'token' in request_json:
        token = request_json['token']
    elif request_args and 'token' in request_args:
        token = request_args['token']
    else:
        token = ''

    SL_TOKEN = os.environ.get("SL_TOKEN", "")
    if SL_TOKEN != token:
        return ""

    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = "key.json"

    if request_json and 'agent_id' in request_json:
        agent_id = request_json['agent_id']
    elif request_args and 'agent_id' in request_args:
        agent_id = request_args['agent_id']
    else:
        agent_id = os.environ.get("AGENT_ID", "e677345d-9fc4-4aa2-851f-31443e801ef2")

    if request_json and 'session_id' in request_json:
        session_id = request_json['session_id']
    elif request_args and 'session_id' in request_args:
        session_id = request_args['session_id']
    else:
        session_id = uuid.uuid4()

    if request_json and 'query' in request_json:
        query = request_json['query']
    elif request_args and 'query' in request_args:
        query = request_args['query']
    else:
        query = ""

    if request_json and 'language_code' in request_json:
        language_code = request_json['language_code']
    elif request_args and 'language_code' in request_args:
        language_code = request_args['language_code']
    else:
        language_code = os.environ.get("LANGUAGE_CODE", "en-us")

    if request_json and 'location_id' in request_json:
        location_id = request_json['location_id']
    elif request_args and 'location_id' in request_args:
        location_id = request_args['location_id']
    else:
        location_id = os.environ.get("LOCATION_ID", "us-central1")

    PROJECT_ID = os.environ.get("PROJECT_ID", "duet-ai-roadshow-415022")

    agent_path = f"projects/{PROJECT_ID}/locations/{location_id}/agents/{agent_id}"
    session_path = f"{agent_path}/sessions/{session_id}"
    session_client = get_session_client(agent_path, location_id)
    text_input = session.TextInput(text=query)
    query_input = session.QueryInput(text=text_input, language_code=language_code)
    request = session.DetectIntentRequest(
        session=session_path, query_input=query_input
    )
    response = session_client.detect_intent(request=request)
    response_messages = [
        " ".join(msg.text.text) for msg in response.query_result.response_messages
    ]
    return ' '.join(response_messages)
