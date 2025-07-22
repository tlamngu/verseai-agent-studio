// import { GRPCUtil } from './grpcUtil';
// import { LogFunction } from '../types';
// import * as fs from 'fs';
// import * as path from 'path';

// export class RemoteToolExecutor {
//     private grpc: GRPCUtil;
//     private protoContent: string;
    
//     constructor(
//         private serviceUrl: string,
//         private log: LogFunction
//     ) {
//         this.grpc = new GRPCUtil(log);
//         this.protoContent = fs.readFileSync(
//             path.join(__dirname, '../protos/remote_tool.proto'),
//             'utf8'
//         );
//     }

//     async executeTool(toolName: string, args: any, metadata: Record<string, string> = {}) {
//         try {
//             const result = await this.grpc.call({
//                 serviceUrl: this.serviceUrl,
//                 protoContent: this.protoContent,
//                 serviceName: 'verseai.RemoteToolExecutor',
//                 methodName: 'ExecuteTool',
//                 requestPayload: {
//                     toolName,
//                     argumentsJson: JSON.stringify(args),
//                     metadata
//                 }
//             });

//             if (!result.success) {
//                 throw new Error(result.error || 'Remote tool execution failed');
//             }

//             return JSON.parse(result.resultJson);
//         } catch (error) {
//             this.log('Remote Tool', `Error executing ${toolName}: ${error.message}`, 'error');
//             throw error;
//         }
//     }

//     async executeRAG(actionName: string, query: string, referenceData: string, metadata: Record<string, string> = {}) {
//         try {
//             const result = await this.grpc.call({
//                 serviceUrl: this.serviceUrl,
//                 protoContent: this.protoContent,
//                 serviceName: 'verseai.RemoteToolExecutor',
//                 methodName: 'ExecuteRAG',
//                 requestPayload: {
//                     actionName,
//                     query,
//                     referenceData,
//                     metadata
//                 }
//             });

//             if (!result.success) {
//                 throw new Error(result.error || 'Remote RAG execution failed');
//             }

//             return {
//                 result: JSON.parse(result.resultJson),
//                 sources: result.sources
//             };
//         } catch (error) {
//             this.log('Remote RAG', `Error executing ${actionName}: ${error.message}`, 'error');
//             throw error;
//         }
//     }
// }