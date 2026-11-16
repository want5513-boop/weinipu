/* 訂歌連結集中管理：帳號或通路若有更換，只需改下面這一處。 */
const ORDER_URL = "https://lin.ee/XaCESBb";


document.querySelectorAll(".js-order-link").forEach((link) => {
  link.href = ORDER_URL;
});
