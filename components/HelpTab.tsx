import React from 'react';
import { CollapsibleSection } from './CollapsibleSection';
import { BoltIcon } from './icons';

const CodeBlock = ({ children }: { children: React.ReactNode }) => (
    <pre className="bg-gray-900 p-3 my-2 rounded-md text-sm text-gray-300 font-mono overflow-x-auto border border-gray-700">
        <code>{children}</code>
    </pre>
);

const Step = ({ n, title, children }: { n: number, title: string, children: React.ReactNode }) => (
    <div className="flex gap-4">
        <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold">{n}</div>
        <div>
            <h4 className="font-bold text-lg text-gray-100">{title}</h4>
            <div className="text-gray-400">{children}</div>
        </div>
    </div>
);


export const HelpTab: React.FC = () => {
    return (
        <div className="p-6 h-full overflow-y-auto text-gray-300">
            <h1 className="text-3xl font-bold mb-4 text-white">VerseAI Agent Studio Guide</h1>
            <p className="mb-8 text-gray-400 max-w-3xl">Welcome! This guide will help you understand how to use the studio, from basic dataset generation to advanced custom tool development.</p>

            <div className="space-y-6 max-w-4xl mx-auto">
                <CollapsibleSection title="1. Getting Started (For All Users)" defaultOpen={true}>
                    <div className="space-y-6 p-2">
                        <Step n={1} title="Define your Goal with the Builder Agent">
                           <p>Go to the <strong>Configuration</strong> tab. Use the chat interface to tell the <strong>Builder Agent</strong> what you want to achieve. For example: "Create a dataset for a customer support chatbot that handles refund requests." The agent will automatically update the project configuration for you.</p>
                        </Step>
                        <Step n={2} title="Start Generating">
                           <p>Navigate to the <strong>Generation</strong> tab. Click the <strong>"Start Generation"</strong> button. The agents will begin creating a conversation based on your project goal. You can watch the conversation and action log in real-time.</p>
                        </Step>
                        <Step n={3} title="Save and View Your Dataset">
                           <p>Once the generation is complete or you've stopped it, click <strong>"Save Dataset"</strong>. Then, go to the <strong>Datasets</strong> tab to view, inspect, and export your newly created dataset in JSON, JSONL, or CSV format.</p>
                        </Step>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="2. Advanced Configuration (For Power Users)">
                     <div className="p-2 space-y-4">
                        <p>For more control, you can bypass the Builder Agent and edit the configuration fields directly on the right side of the <strong>Configuration</strong> tab.</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-400">
                            <li><strong>Project Description (Goal):</strong> The high-level objective for the agents. This is the most important field for guiding the AI.</li>
                            <li><strong>Base Scenario:</strong> A specific context for the conversations (e.g., "The user is angry about a late delivery").</li>
                            <li><strong>Reference Data:</strong> A knowledge base for the agents. Paste any text (API docs, product info, FAQs) here, and the agents will use it to inform their responses.</li>
                            <li><strong>AI Provider:</strong> Switch between Google Gemini and a local, OpenAI-compatible provider. For local models, ensure your provider is running and the Base URL is correct.</li>
                             <li><strong>Agent Prompts & Models:</strong> In the collapsible section at the bottom, you can customize the system prompts for each agent and assign specific models to them for fine-grained control.</li>
                        </ul>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="3. Tool Development (For Developers)">
                    <div className="p-2 space-y-4">
                        <p>You can give the Agent LLM custom tools to interact with external systems or data sources.</p>
                        <h3 className="text-xl font-semibold text-gray-100 pt-2">Creating and Editing Tools</h3>
                        <p>Tools are created in the <strong>Configuration</strong> tab under "RAG Actions" or "Function Call Tools". After creating a tool and giving it a name and description, go to the <strong>Tool Editor</strong> tab to write its code and test it in a sandbox environment.</p>

                        <h3 className="text-xl font-semibold text-gray-100 pt-2">The Tool SDK</h3>
                        <p>A powerful, sandboxed SDK is available in the <code>sdk</code> object passed to every tool function. It provides utilities for logging, data access, and network requests.</p>
                        
                        <div className="space-y-4">
                           <div>
                                <h4 className="font-semibold text-gray-200"><code>sdk.log(message: string)</code></h4>
                                <p className="text-gray-400 text-sm">Logs a message to the Action Log during generation, or the Output panel in the Tool Editor. Essential for debugging.</p>
                           </div>
                           <div>
                                <h4 className="font-semibold text-gray-200"><code>sdk.getConfig()</code></h4>
                                <p className="text-gray-400 text-sm">Returns a read-only object with core project settings: <code>{'{ projectName, projectDescription, scenario }'}</code>.</p>
                           </div>
                            <div>
                                <h4 className="font-semibold text-gray-200"><code>sdk.getReferenceData()</code></h4>
                                <p className="text-gray-400 text-sm">Returns the full string content of the "Reference Data" field. You can use this to implement your own search or data extraction logic.</p>
                           </div>
                           <div>
                                <h4 className="font-semibold text-gray-200"><code>sdk.http.get(url, headers?)</code> and <code>sdk.http.post(url, body, headers?)</code></h4>
                                <p className="text-gray-400 text-sm">Make secure HTTP requests to external APIs. The runner handles the request and logs successes or failures.</p>
                           </div>
                            <div className="flex flex-col gap-2 p-4 rounded-md bg-gray-800/50 border border-gray-700">
                                <h4 className="font-bold text-lg text-gray-100 flex items-center gap-2"><BoltIcon className="w-5 h-5 text-yellow-400" /> New: gRPC Support</h4>
                                <h5 className="font-semibold text-gray-200"><code>sdk.grpc.call(options)</code></h5>
                                <p className="text-gray-400 text-sm">Make unary gRPC-web calls to a compatible backend. This allows your tools to communicate with high-performance microservices.</p>
                                <p className="text-xs text-yellow-300/80 p-2 bg-yellow-900/30 rounded-md border border-yellow-700/50">
                                    <strong>Note:</strong> Your gRPC server must be accessible from the browser and have a gRPC-web proxy (like Envoy or the built-in Go/Node proxies) to translate HTTP/1.1 requests to gRPC.
                                </p>
                                <p className="text-gray-400 text-sm">The `call` method takes an options object:</p>
                                <CodeBlock>{`sdk.grpc.call({
  serviceUrl: string,      // e.g., 'http://localhost:8080'
  protoContent: string,    // The full text content of your .proto file
  serviceName: string,     // e.g., 'mypackage.MyService'
  methodName: string,      // e.g., 'MyMethod'
  requestPayload: object,  // A JS object matching the request message
});`}</CodeBlock>
                           </div>
                        </div>

                        <h4 className="text-lg font-semibold mt-4 mb-2 text-gray-200">Example: gRPC Health Check Tool</h4>
                        <p className="mb-2 text-gray-400">This example defines a simple gRPC service inline and calls it. The LLM can invoke this tool by its name, `check_system_health`, to get version information from a backend service.</p>
                        <CodeBlock>{`// Tool Name: check_system_health
// Tool Description: Checks the health of a remote system using gRPC.

// Define the .proto content for the service.
const PROTO_CONTENT = \`
  syntax = "proto3";
  package health;

  service HealthCheck {
    rpc GetVersion(VersionRequest) returns (VersionResponse);
  }
  message VersionRequest {}
  message VersionResponse {
    string version = 1;
  }
\`;

async function tool(sdk, args) {
  // This is a dummy URL and will not work without a real server.
  const SERVICE_URL = 'http://localhost:8080';
  sdk.log('Attempting to call gRPC health check...');

  try {
    const response = await sdk.grpc.call({
      serviceUrl: SERVICE_URL,
      protoContent: PROTO_CONTENT,
      serviceName: 'health.HealthCheck',
      methodName: 'GetVersion',
      requestPayload: {} // Empty request for this method
    });

    sdk.log(\`gRPC response received: \${JSON.stringify(response)}\`);
    return \`System is healthy. Version: \${response.version}\`;

  } catch (error) {
    sdk.log(\`gRPC call failed: \${error.message}\`, 'error');
    return \`Failed to check system health: \${error.message}\`;
  }
}`}</CodeBlock>
                    </div>
                </CollapsibleSection>

                 <div className="mt-12 pt-6 border-t border-gray-700 text-center text-sm text-gray-500">
                    <p>© 2024 VerseAI. All rights reserved.</p>
                    <p>Licensed under the <a href="http://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Apache 2.0 License</a>.</p>
                </div>
            </div>
        </div>
    );
};