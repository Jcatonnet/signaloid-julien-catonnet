import { createApp } from "vue";
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import App from "./App.vue";
import "./index.css";

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    themes: {
      light: {
        colors: {
          primary: "#1b084d",
          secondary: "#aaa6c3",
        },
      },
    },
  },
});

createApp(App).use(vuetify).mount("#app");
