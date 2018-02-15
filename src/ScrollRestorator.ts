import { Transition } from "./Transition";
import { PublicRouter } from "./PublicRouter";

// export class BrowserScrollRestorator {
//     init() {
//         history.scrollRestoration = 'manual';
//     }
//     get(publicRouter: PublicRouter) {
//         return window.scrollY;
//     }
//     set(pos: number, publicRouter: PublicRouter, prevTransition: Transition) {
//         if (transtion.url.split('?')[0] !== prevTransition.url.split('?')[0]) {
//             window.scrollTo(0, pos);
//         }
//         if (transtion.hash !== void 0) {
//             var element = document.getElementById(transtion.hash);
//             if (element) {
//                 window.scrollTo(0, element.offsetTop);
//             }
//         }
//     }
// }

// export const browserScrollRestorator = new BrowserScrollRestorator();
