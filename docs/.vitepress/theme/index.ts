import DefaultTheme from "vitepress/theme";
import {h, onMounted, watch} from "vue";
import {useData, useRouter} from "vitepress";
import BackToTop from "./components/BackToTop.vue";
import NavContactGroup from "./components/NavContactGroup.vue";
import ReadingTime from "./components/ReadingTime.vue";
import SocialTitles from "./components/SocialTitles.vue";
import AnnouncementPopup from "./components/AnnouncementPopup.vue";
import VersionPopup from "./components/VersionPopup.vue";
import QuickStartPopup from "./components/QuickStartPopup.vue";
import SmartDownloadChannels from "./components/SmartDownloadChannels.vue";
import {enhanceMirrorLinks} from "./enhanceMirrorLinks";
import "./custom.css";


export default {
    extends: DefaultTheme,

    Layout() {
        const { theme } = useData();
        const router = useRouter();
        const runEnhance = () => {
            const version = theme.value.latestReleaseMeta?.version ?? '';
            if (version) enhanceMirrorLinks(version);
        };
        onMounted(() => {
            runEnhance();
            watch(() => router.route.path, () => setTimeout(runEnhance, 100));
        });
        return h(DefaultTheme.Layout, null, {
            "layout-top": () => [h(SocialTitles), h(AnnouncementPopup), h(VersionPopup), h(QuickStartPopup)],
            "nav-bar-content-before": () => {
                const meta = theme.value.latestReleaseMeta;
                return meta ? h('a', {
                    class: 'nav-version-mobile',
                    href: '#version-popup',
                    innerHTML: `<span class="nav-version-badge"><span class="nav-version-spark">✦</span><span>${meta.version}</span></span>`
                }) : null;
            },
            "nav-screen-content-after": () => h(NavContactGroup),
            "doc-before": () => h(ReadingTime),
            "doc-bottom": () => h(BackToTop),
        });
    },

    enhanceApp({ app }: { app: any }) {
        app.component('SmartDownloadChannels', SmartDownloadChannels);
    },
};
