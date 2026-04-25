export type MnaMessageMap = Record<string, string>;

export function formatMnaMessage(
    template: string,
    params: Record<string, string | number> = {}
): string {
    return template.replace(/\{(\w+)\}/g, (_, key: string) => {
        const value = params[key];
        return value === undefined ? `{${key}}` : String(value);
    });
}
