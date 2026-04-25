import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";

export default createVuetify({
    ssr: true,
    components,
    directives,
    theme: {
        defaultTheme: "vitepressLight",
        themes: {
            vitepressLight: {
                dark: false,
                colors: {
                    background: "#ffffff",
                    surface: "#f6f6f7",
                    "surface-bright": "#ffffff",
                    "surface-variant": "#f6f6f7",
                    primary: "#3451b2",
                    secondary: "#67676c",
                    success: "#299764",
                    warning: "#946300",
                    error: "#d5393e",
                    info: "#3a5ccc",
                },
            },
            vitepressDark: {
                dark: true,
                colors: {
                    background: "#1b1b1f",
                    surface: "#202127",
                    "surface-bright": "#26272d",
                    "surface-variant": "#202127",
                    primary: "#a8b1ff",
                    secondary: "#98989f",
                    success: "#3dd68c",
                    warning: "#f9b44e",
                    error: "#f66f81",
                    info: "#5c73e7",
                },
            },
        },
    },
});
