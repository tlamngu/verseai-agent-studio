import * as protobuf from 'protobufjs';
import * as grpcWeb from 'grpc-web';
import { LogMessage } from '../types';

type LogFunction = (source: string, content: string, type: LogMessage['type']) => void;

interface GRPCCallOptions {
    serviceUrl: string;
    protoContent: string;
    serviceName: string;
    methodName: string;
    requestPayload: object;
}

export class GRPCUtil {
    private log: LogFunction;

    constructor(log: LogFunction) {
        this.log = log;
    }

    public async call(options: GRPCCallOptions): Promise<any> {
        this.log('SDK.gRPC', `Initiating call to ${options.serviceName}.${options.methodName}`, 'info');

        try {
            // 1. Parse the .proto file content
            const { root } = protobuf.parse(options.protoContent, { keepCase: true });

            // 2. Look up the service and method
            const service = root.lookupService(options.serviceName);
            if (!service) {
                throw new Error(`Service '${options.serviceName}' not found in proto definition.`);
            }

            const method = service.methods[options.methodName];
            if (!method) {
                throw new Error(`Method '${options.methodName}' not found in service '${options.serviceName}'.`);
            }
            method.resolve(); // Resolves all types used within the method

            // 3. Look up request and response message types
            const RequestType = method.resolvedRequestType;
            const ResponseType = method.resolvedResponseType;
            if (!RequestType || !ResponseType) {
                throw new Error('Could not resolve request or response types for the method.');
            }

            // 4. Create and verify the request message from the payload
            const requestPayloadError = RequestType.verify(options.requestPayload);
            if (requestPayloadError) {
                throw new Error(`Request payload validation failed: ${requestPayloadError}`);
            }
            const requestMessage = RequestType.create(options.requestPayload);
            
            // 5. Define serializers and create a MethodDescriptor for grpc-web
            const methodDescriptor = new grpcWeb.MethodDescriptor(
                `/${service.fullName}/${method.name}`,
                grpcWeb.MethodType.UNARY,
                // These are constructor functions, which protobuf.js types are.
                RequestType as any, 
                ResponseType as any,
                // Serializer: takes a message instance, returns Uint8Array
                (req: protobuf.Message) => (req.constructor as typeof protobuf.Type).encode(req).finish(),
                // Deserializer: takes Uint8Array, returns a message instance
                (res: Uint8Array) => (ResponseType as typeof protobuf.Type).decode(res)
            );

            // 6. Wrap the unary call in a Promise
            return new Promise((resolve, reject) => {
                grpcWeb.unary(methodDescriptor, {
                    request: requestMessage as any,
                    host: options.serviceUrl,
                    onEnd: (res: grpcWeb.UnaryResponse<any, any>) => {
                        const { status, statusMessage, message } = res;

                        if (status === grpcWeb.Code.OK) {
                            if (message) {
                                const responseObject = message.toObject();
                                this.log('SDK.gRPC', `Call successful. Response: ${JSON.stringify(responseObject)}`, 'action');
                                resolve(responseObject);
                            } else {
                                this.log('SDK.gRPC', 'Call successful but received no message.', 'warning');
                                resolve({});
                            }
                        } else {
                            const error = new Error(`gRPC Error: ${statusMessage} (Code: ${status})`);
                            this.log('SDK.gRPC', error.message, 'error');
                            reject(error);
                        }
                    },
                });
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.log('SDK.gRPC', `Setup for gRPC call failed: ${errorMessage}`, 'error');
            throw error; // Re-throw the error to be caught by the tool's try/catch block
        }
    }
}