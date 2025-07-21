import { AgentRole, AIProviderType, ProjectConfig, Workspace } from './types';

export const AVAILABLE_GEMINI_MODELS = ['gemini-2.5-flash'];

export const WATCHER_QUALITY_PROMPT_TEMPLATE = `You are a Watcher Agent. Your role is to evaluate the quality of a conversation turn.
Project Goal: {PROJECT_GOAL}
User Prompt: "{USER_PROMPT}"
Agent Response: "{AGENT_RESPONSE}"

Evaluate the quality of the agent's response based on its relevance to the user prompt, its coherence with the project goal, and its overall helpfulness.
Output ONLY a JSON object with a single key "qualityScore" and a numeric score from 0 to 100. Do not add any explanation or formatting. Example: {"qualityScore": 85}`;


export const DEFAULT_PROMPTS = {
  [AgentRole.USER]: `You are a User Agent simulating a real user. Your goal is to generate a realistic user prompt that continues a conversation naturally.
Project Goal: {PROJECT_GOAL}
Base Scenario: {SCENARIO}
Reference Data (use this as your knowledge base):
<ReferenceData>
{REFERENCE_DATA}
</ReferenceData>
Previous conversation history (most recent messages are last):
<History>
{HISTORY}
</History>
Based on the full context, generate the next user prompt. The prompt should be concise, natural, and relevant. Do not repeat previous prompts. If the history is empty, create a logical first prompt based on the scenario. Output ONLY the user's prompt text.`,
  [AgentRole.AGENT_LLM]: `You are an Agent LLM. Your persona and task are defined by the project goal and base scenario.
Project Goal: {PROJECT_GOAL}
Base Scenario: {SCENARIO}
Reference Data (use this as your knowledge base):
<ReferenceData>
{REFERENCE_DATA}
</ReferenceData>
Conversation History:
<History>
{HISTORY}
</History>
You have access to a set of tools you can use to answer the user's request.
Based on the user's last message, you can either respond directly or call one or more tools.
Respond to the user's prompt accurately and concisely, staying in character and using the reference data and tool outputs if relevant.`,
  [AgentRole.WATCHER]: `I am the Watcher Agent. I perform two key functions in the generation cycle:
1.  **Scenario Generation**: I create the context for each conversation turn.
2.  **Quality Evaluation**: I score the quality of the Agent LLM's response.
(Note: The core logic for these functions uses standardized internal prompts for reliability. This text is for informational purposes.)`,
  [AgentRole.BUILDER]: `You are a Builder Agent, an expert in setting up LLM dataset generation projects, including writing code for custom tools. Your goal is to help the user configure their project by analyzing their request.

- The user's latest message is: "{USER_MESSAGE}"

- Analyze this message. The user might want to:
  1. Define the project's goal, scenario, or reference data.
  2. Create, modify, or delete a custom Javascript tool or RAG action.

- Here is the current project configuration:
  - Project Description: {PROJECT_DESCRIPTION}
  - Scenario: {SCENARIO}
  - Reference Data Snippet (first 500 chars): {REFERENCE_DATA_SNIPPET}
  - Unsafe Code Execution Enabled: {IS_UNSAFE_EXECUTION_ENABLED}

- Here are the existing Tools and RAG Actions:
<Tools>
{CURRENT_TOOLS}
</Tools>
<RAGActions>
{CURRENT_RAG_ACTIONS}
</RAGActions>

- Based ONLY on the user's latest message and the existing configuration, determine the required changes.
- IMPORTANT: When writing tool code, you have access to a special 'sdk' object.
  - sdk.log(message, type?): Logs output.
  - sdk.getConfig(): Gets project info.
  - sdk.getReferenceData(): Gets reference data.
  - sdk.http.get(url)/.post(url, body): Makes HTTP requests.
  - sdk.grpc.call(options): Makes gRPC-web calls.
  - If Unsafe Code Execution is ENABLED, you can also use browser APIs like 'fetch', 'window', 'document', etc. Otherwise, you are in a sandbox and MUST use the sdk methods.
- Your response MUST be a JSON object with two keys:
  1. "response": A friendly, conversational reply to the user, explaining what you've updated. Acknowledge their request and confirm the changes. If you write or change code, briefly mention it.
  2. "configChanges": A JSON object containing ONLY the keys for the fields that need to be updated.
     - To update text fields ('projectDescription', 'scenario', 'referenceData'), include the key with the new string value.
     - To update tools or RAG actions (create, modify, delete), you MUST provide the ENTIRE, complete list for the 'tools' or 'ragActions' key. The old list will be replaced by your new one. To delete a tool, simply omit it from the new list you provide. When creating a new tool, generate a unique ID like \`tool-171234567890\`.

- Example: If the user says "add a tool to get the weather", your 'configChanges' would be {"tools": [{"id": "tool-171234567890", "name": "get_weather", "description": "Fetches the weather for a given location", "code": "async function tool(sdk, args) {\\n  // ... code ...\\n}"}]}.
- If the request is unclear, ask for clarification in your 'response' and return an empty 'configChanges' object.
- Only include fields that are being changed.`,
};

export const EDITOR_AGENT_PROMPT_TEMPLATE = `You are an expert Javascript developer and an assistant for the VerseAI Agent Studio.
Your task is to help the user write or modify Javascript code for a custom tool.
You will be given the tool's intended purpose (description), the user's specific request, and the current code in the editor.

# Tool's Purpose
{TOOL_DESCRIPTION}

# User's Request
{USER_REQUEST}

# Current Code
\`\`\`javascript
{CURRENT_CODE}
\`\`\`

# Instructions
1.  Read all the context provided.
2.  Modify the *Current Code* to satisfy the *User's Request*.
3.  Your response MUST be ONLY the complete, final Javascript code.
4.  Do NOT include explanations, apologies, or markdown formatting like \`\`\`javascript.
5.  Ensure the code is valid and complete. If the user asks to add a function, include the existing code and the new function. You must return the entire script.`;

export const createInitialConfig = (): ProjectConfig => ({
    projectName: 'New Dataset Project',
    projectDescription: 'A new fine-tuning dataset generated by the studio.',
    scenario: 'A general conversation between a user and an AI assistant.',
    referenceData: 'No reference data provided. Agents will rely on general knowledge.',
    aiProvider: AIProviderType.LOCAL_OPENAI,
    localAIConfig: {
      baseURL: 'http://localhost:1234/v1',
      apiKey: 'not-needed',
    },
    tools: [],
    ragActions: [],
    isUnsafeCodeExecutionEnabled: false,
    [AgentRole.USER]: {
        prompt: DEFAULT_PROMPTS[AgentRole.USER],
        model: 'local-model',
    },
    [AgentRole.AGENT_LLM]: {
        prompt: DEFAULT_PROMPTS[AgentRole.AGENT_LLM],
        model: 'local-model',
    },
    [AgentRole.WATCHER]: {
        prompt: DEFAULT_PROMPTS[AgentRole.WATCHER],
        model: 'local-model',
    },
    [AgentRole.BUILDER]: {
        prompt: DEFAULT_PROMPTS[AgentRole.BUILDER],
        model: 'local-model',
    },
});

export const EXAMPLE_HN_QA_AGENT_WORKSPACE: Workspace = {
    id: 'example-hn-qa-agent',
    config: {
        ...createInitialConfig(),
        projectName: 'Hacker News Q&A Agent',
        projectDescription: 'An agent that answers questions by searching for relevant discussions on Hacker News.',
        scenario: 'A user asks a question about technology, startups, or programming trends. The agent should use its tool to search Hacker News.',
        referenceData: "This is a local document the RAG action can search. The secret keyword is 'syzygy'. Use the `search_local_documents` tool for questions about secret keywords.",
        tools: [
            {
                id: 'tool-hn-search-example',
                name: 'search_hacker_news',
                description: 'Searches Hacker News for discussions and comments related to a query. Use this for questions about tech, startups, and programming.',
                code: `async function tool(sdk, args) {
  const query = args.query;
  if (!query) {
    return "A query is required to search Hacker News.";
  }

  sdk.log(\`Searching Hacker News for: "\${query}"\`);

  try {
    // Using the public Algolia HN Search API
    const url = \`http://hn.algolia.com/api/v1/search?query=\${encodeURIComponent(query)}&tags=story&hitsPerPage=5\`;
    const response = await sdk.http.get(url);

    if (response && response.hits && response.hits.length > 0) {
      sdk.log(\`Found \${response.hits.length} results.\`);
      
      const summaries = response.hits.map(hit => ({
        title: hit.title,
        url: hit.url,
        author: hit.author,
        points: hit.points,
        num_comments: hit.num_comments
      }));

      // Return a structured summary for the LLM to process
      return \`Found the following top 5 results on Hacker News for "\${query}":\\n\\n\` + 
        summaries.map((s, i) => 
          \`\${i+1}. "\${s.title}" by \${s.author} (Points: \${s.points}, Comments: \${s.num_comments})\\nURL: \${s.url}\`
        ).join('\\n\\n');

    } else {
      sdk.log("No results found on Hacker News.");
      return \`No results found on Hacker News for "\${query}".\`;
    }
  } catch (error) {
    sdk.log(\`Error fetching data from Hacker News API: \${error.message}\`, 'error');
    return "There was an error trying to search Hacker News.";
  }
}`
            },
            {
                id: 'tool-grpc-health-check-example',
                name: 'check_system_health',
                description: 'Checks the health of a remote system using gRPC. Use this to get status or version info.',
                code: `// Define the .proto content for the service.
const PROTO_CONTENT = \`
syntax = "proto3";

package health;

// The health checking service definition.
service HealthCheck {
  // Get the version of the system.
  rpc GetVersion(VersionRequest) returns (VersionResponse);
}

// The request message for GetVersion is empty.
message VersionRequest {}

// The response message containing the version.
message VersionResponse {
  string version = 1;
}
\`;

async function tool(sdk, args) {
  // NOTE: This tool requires a gRPC-web compatible server proxy.
  // This is a dummy URL and will not work without a real server.
  const SERVICE_URL = 'http://localhost:8080';

  sdk.log('Attempting to call gRPC health check...');

  try {
    const response = await sdk.grpc.call({
      serviceUrl: SERVICE_URL,
      protoContent: PROTO_CONTENT,
      serviceName: 'health.HealthCheck',
      methodName: 'GetVersion',
      requestPayload: {} // Empty request for GetVersion
    });

    sdk.log(\`gRPC response received: \${JSON.stringify(response)}\`);
    return \`System is healthy. Version: \${response.version}\`;

  } catch (error) {
    const errorMessage = error.message || 'Unknown gRPC error';
    sdk.log(\`gRPC call failed: \${errorMessage}\`, 'error');
    return \`Failed to check system health: \${errorMessage}\`;
  }
}`
            }
        ],
        ragActions: [
            {
                id: 'rag-local-search-example',
                name: 'search_local_documents',
                description: 'Searches through the local reference data provided in the configuration. Use this for specific, internal knowledge.',
                code: `// This RAG action searches the 'Reference Data' field.
async function tool(sdk, args) {
  const query = args.query || '';
  sdk.log(\`Searching local documents for: "\${query}"\`);
  
  const referenceData = sdk.getReferenceData();
  
  // A simple case-insensitive search.
  if (referenceData.toLowerCase().includes(query.toLowerCase())) {
    const result = \`Found a mention of "\${query}" in the local documents.\`;
    sdk.log(result);
    return result;
  } else {
    const result = \`Could not find any mention of "\${query}" in the local documents.\`;
    sdk.log(result);
    return result;
  }
}`
            }
        ],
    },
    datasets: [],
    builderMessages: [
        { 
            role: 'assistant', 
            content: `Welcome! This is an example workspace for a Hacker News Q&A Agent. It's configured with three tools:
1.  An API tool 'search_hacker_news' to find real-time discussions on Hacker News.
2.  A custom 'search_local_documents' RAG tool to search the text in the "Reference Data" field.
3.  A 'check_system_health' gRPC tool to demonstrate communication with a gRPC backend.

Go to the 'Generation' tab and try asking:
- "What are the latest discussions about React?" (to test the API tool)
- "What is the secret keyword?" (to test local RAG)`, 
            timestamp: new Date().toLocaleTimeString() 
        }
    ],
};

export const EXAMPLE_GAMEDEV_ASSISTANT_WORKSPACE: Workspace = {
    id: 'example-gamedev-assistant',
    config: {
        ...createInitialConfig(),
        projectName: 'GameDev AI Assistant',
        projectDescription: 'An AI assistant that helps with creative writing, code generation, and server management for a fantasy RPG project called "Aethelgard".',
        scenario: 'A game developer is asking for help with world-building, character creation, quest design, or needs a snippet of boilerplate code for their game engine.',
        referenceData: `--- Aethelgard Game Design Document (Snippet) ---

## World Lore

Aethelgard is a realm fractured by a past cataclysm known as "The Sundering". Magic is wild and dangerous, and ancient ruins of a precursor civilization dot the landscape.

## Factions

1.  **The Silver Hand Order:**
    *   **Description:** A knightly order dedicated to protecting the innocent and restoring order. They are generally seen as heroic, but can be rigid and dogmatic in their views. They are wary of uncontrolled magic.
    *   **Leader:** High Commander Valerius
    *   **Base:** The Citadel of Dawn, a mountain fortress.

2.  **The Circle of Whispers:**
    *   **Description:** A secretive cabal of mages and scholars who believe that the wild magic of The Sundering can be controlled and mastered. They operate in the shadows and are often viewed with suspicion.
    *   **Goal:** To unlock the secrets of the precursors.
    *   **Notable Members:** Arch-Scribe Elara.

3.  **The Rustfang Clans:**
    *   **Description:** A loose confederation of goblin and orc tribes who inhabit the blasted lowlands. They are opportunistic scavengers and raiders, not inherently evil, but driven by survival. They possess a surprising talent for mechanical contraptions.
    *   **Secret:** They secretly trade precursor artifacts with the Circle of Whispers.
`,
        tools: [
            {
                id: 'tool-gamedev-python-gen',
                name: 'generate_python_code',
                description: "Generates a Python code snippet for a common game development task, like a simple inventory system or a player movement controller. The query should describe the desired functionality.",
                code: `// This is a mock tool. It returns a pre-written code block.
async function tool(sdk, args) {
  const query = args.query || '';
  sdk.log(\`Generating Python code for: "\${query}"\`);

  if (query.toLowerCase().includes('inventory')) {
    return \`class Inventory:
    def __init__(self):
        self.items = {}

    def add_item(self, item_name, quantity=1):
        self.items[item_name] = self.items.get(item_name, 0) + quantity
        sdk.log(\`Added \${quantity} of \${item_name} to inventory.\`)

    def remove_item(self, item_name, quantity=1):
        if item_name in self.items:
            self.items[item_name] -= quantity
            if self.items[item_name] <= 0:
                del self.items[item_name]
            sdk.log(\`Removed \${quantity} of \${item_name} from inventory.\`)
        else:
            sdk.log(\`Item \${item_name} not found in inventory.\`)
            
    def __str__(self):
        return str(self.items)

# Example usage:
player_inventory = Inventory()
player_inventory.add_item("Health Potion", 5)
print(player_inventory)\`
  }
  
  return "Could not generate code for that request. Try asking for a 'simple inventory class'.";
}`
            },
            {
                id: 'tool-gamedev-grpc-status',
                name: 'check_dev_server_status',
                description: "Pings the development game server to check its status and get the current player count. Use this when asked 'is the server up?' or 'how many players are online?'",
                code: `// This tool demonstrates gRPC. It requires a compatible gRPC-web server.
const PROTO_CONTENT = \`
syntax = "proto3";

package gamedev;

service GameServer {
  rpc GetStatus(StatusRequest) returns (StatusResponse);
}

message StatusRequest {}

message StatusResponse {
  string status = 1;
  int32 player_count = 2;
  string server_version = 3;
}
\`;

async function tool(sdk, args) {
  // NOTE: This tool requires a gRPC-web compatible server proxy.
  // This is a dummy URL and will likely fail without a real server.
  const SERVICE_URL = 'http://localhost:8081';

  sdk.log('Pinging game development server via gRPC...');

  try {
    const response = await sdk.grpc.call({
      serviceUrl: SERVICE_URL,
      protoContent: PROTO_CONTENT,
      serviceName: 'gamedev.GameServer',
      methodName: 'GetStatus',
      requestPayload: {}
    });

    sdk.log(\`gRPC response received: \${JSON.stringify(response)}\`);
    return \`The server is ONLINE. Player count: \${response.player_count}. Version: \${response.server_version}\`;

  } catch (error) {
    const errorMessage = error.message || 'Unknown gRPC error';
    sdk.log(\`gRPC call failed: \${errorMessage}\`, 'error');
    // Provide a helpful mock response on failure for a better demo experience
    return "The server appears to be OFFLINE. (This is a mock response; could not connect to gRPC endpoint).";
  }
}`
            }
        ],
        ragActions: [
            {
                id: 'rag-gamedev-lore-check',
                name: 'check_lore_consistency',
                description: "Checks the provided query against the Game Design Document (reference data) to ensure new ideas are consistent with established lore. Use this to verify facts about factions, locations, or historical events.",
                code: `// This RAG action searches the 'Reference Data' GDD field.
async function tool(sdk, args) {
  const query = args.query || '';
  sdk.log(\`Checking lore consistency for: "\${query}"\`);
  
  const gameDesignDocument = sdk.getReferenceData();
  
  // A simple case-insensitive search. A real implementation
  // might use more advanced searching or chunking.
  if (gameDesignDocument.toLowerCase().includes(query.toLowerCase())) {
    // For a better response, we could try to find the specific line.
    const lines = gameDesignDocument.split('\\n');
    const relevantLines = lines.filter(line => line.toLowerCase().includes(query.toLowerCase()));
    
    let result = \`Found a mention of "\${query}" in the lore document.\`;
    if (relevantLines.length > 0) {
      result += " Relevant info: \\n" + relevantLines.join('\\n');
    }
    sdk.log(result);
    return result;
  } else {
    const result = \`Could not find any mention of "\${query}" in the lore document.\`;
    sdk.log(result);
    return result;
  }
}`
            }
        ],
    },
    datasets: [],
    builderMessages: [
        { 
            role: 'assistant', 
            content: `Welcome to the GameDev AI Assistant! This workspace is configured to help you build your fantasy RPG, "Aethelgard".

It has several tools ready:
1.  **check_lore_consistency**: A RAG tool to search the Game Design Document in "Reference Data".
2.  **generate_python_code**: An API tool that can write some boilerplate Python code.
3.  **check_dev_server_status**: A gRPC tool to check the status of a (mock) game server.

Go to the 'Generation' tab and try asking:
- "Is the Silver Hand Order a friendly faction?"
- "Can you write me a python script for a simple inventory system?"
- "Is the dev server online?"`, 
            timestamp: new Date().toLocaleTimeString() 
        }
    ],
};