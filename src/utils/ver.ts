import config from "@/../package.json";
let updateauthor: string | null = null;
let typer: string | null = null;

export const parseVersion = (ver: string) => {
    const versionMatch = ver.match(/^(\d+\.\d+\.\d+)/);
    const isDevelopment = /\.dev\b/.test(ver);
    const isPreview = /\.pre\b/.test(ver);
    const isBeta = /\.beta\b/.test(ver);
    const channelMatch = ver.match(/\[([^\]]+)\]$/);
    if (isPreview) {
        typer = 'preview';
    } else if (isDevelopment) {
        typer = 'development'
    } else if (isBeta) {
        typer = 'beta';
    } else {
        typer = 'release';
    };
    if (channelMatch?.[1] != 'imsyy') {
        updateauthor = config.efua;
    } else {
        updateauthor = config.author;
    };
    return {
        version: versionMatch?.[1] || '0.0.0',
        type: typer,
        channel: channelMatch?.[1] || 'imsyy',
        upa: updateauthor
    };
};

