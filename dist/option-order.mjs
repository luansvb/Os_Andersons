// Shuffle by case and decision, so redraws, notifications and saved games keep
// the same buttons in place. Game rules continue to use the original IDs.
export function shuffleOptions(items,caseId,decision){
 let seed=2166136261;
 for(const c of JSON.stringify([String(caseId),String(decision)]))seed=Math.imul(seed^c.charCodeAt(0),16777619);
 const next=()=>{seed=(seed+0x6D2B79F5)|0;let n=Math.imul(seed^(seed>>>15),1|seed);n^=n+Math.imul(n^(n>>>7),61|n);return ((n^(n>>>14))>>>0)/4294967296;};
 const result=[...items];
 for(let i=result.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
 return result;
}
export const choiceOptions=(options,caseId,decision)=>shuffleOptions(options.map((text,index)=>({text,index})),caseId,decision);
