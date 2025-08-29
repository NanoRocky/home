export function createResetPlugin() {
    return ({ store }) => {
        const initialState = JSON.parse(JSON.stringify(store.$state));
        store.$reset = () => {
            store.$patch(JSON.parse(JSON.stringify(initialState)));
            store.$state = JSON.parse(JSON.stringify(initialState));
        };
    };
};