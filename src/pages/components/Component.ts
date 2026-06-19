export interface Component {
    isReady(): Promise<void>;
}