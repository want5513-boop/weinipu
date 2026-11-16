/* 訂歌連結集中管理：帳號或通路若有更換，只需改下面這一處。 */
const ORDER_URL = "https://instagram.com/weinipu.song";

/* LINE 官方帳號預留：開通後把上一行改成下面這行即可
const ORDER_URL = "https://line.me/R/ti/p/@YOUR_LINE_ID";
*/

document.querySelectorAll(".js-order-link").forEach((link) => {
  link.href = ORDER_URL;
});
