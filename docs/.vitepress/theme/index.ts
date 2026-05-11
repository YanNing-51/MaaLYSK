import DefaultTheme from "vitepress/theme";
import {h} from "vue";
import BackToTop from "./components/BackToTop.vue";
import NavContactGroup from "./components/NavContactGroup.vue";
import "./custom.css";
import Mermaid from "./components/Mermaid.vue";
import Flowchart from './components/Flowchart.vue'

export default {
    extends: DefaultTheme,

    Layout() {
        return h(DefaultTheme.Layout, null, {
            "nav-bar-content-after": () => h(NavContactGroup),
            "doc-bottom": () => h(BackToTop),
        });
    },

    enhanceApp({ app }: { app: any }) {  // 添加类型声明
        app.component('Mermaid', Mermaid);
        app.component('Flowchart', Flowchart);
    },
};
