// Canvas cameras use design pixels when a phone gets a wide desktop viewport.
export function designWidth(element){
 const width=element.getBoundingClientRect().width;
 const style=getComputedStyle(document.documentElement);
 return style.getPropertyValue('--phone-ui').trim()==='1'?width*16/parseFloat(style.fontSize):width;
}
