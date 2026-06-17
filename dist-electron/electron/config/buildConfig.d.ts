export declare const buildConfig: {
    appId: string;
    productName: string;
    executableName: string;
    directories: {
        buildResources: string;
        output: string;
    };
    files: string[];
    win: {
        target: string[];
    };
    mac: {
        target: string[];
    };
    linux: {
        target: string[];
    };
    nsis: {
        oneClick: boolean;
        allowToChangeInstallationDirectory: boolean;
    };
};
export declare function getIconPath(): string;
export declare function getOutputDir(): string;
export declare function getAppId(): string;
export declare function getProductName(): string;
//# sourceMappingURL=buildConfig.d.ts.map