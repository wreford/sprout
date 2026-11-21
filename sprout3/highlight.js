// Sprout syntax highlighting, shared by the editor (play.html) and the pocket console's program sheet (silvereye).
// One line of Sprout in, HTML out: comments, text (with [inserts] highlighted inside), literals, numbers, known words,
// true/false, and the : and | that make cells. It follows the same rules as Sprout 3's tokenizer.
(function (root) {
"use strict";
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
let known = null;
function line(s, WORDS) {
  const S = root.Sprout3;
  // with no list given, every word Sprout itself knows (asked once, then kept)
  WORDS = WORDS || known || (known = S && S.knownWords ? S.knownWords() : new Set());
let o="",i=0;const n=s.length;
 while(i<n){const c=s[i];
  if(c==="-"&&s[i+1]==="-"){o+='<i class="c">'+esc(s.slice(i))+"</i>";break}
  if(c==='"'){let j=i+1,buf='"',h="";while(j<n&&s[j]!=='"'){if(s[j]==="\\"){buf+=s.slice(j,j+2);j+=2;continue}
    if(s[j]==="["){let d=1,k=j+1;while(k<n&&d&&s[k]!=='"'){if(s[k]==="[")d++;else if(s[k]==="]")d--;if(d)k++}h+='<i class="s">'+esc(buf)+'</i><i class="tp">['+line(s.slice(j+1,k), WORDS)+(s[k]==="]"?"]":"")+"</i>";buf="";j=s[k]==="]"?k+1:k;continue}
    buf+=s[j];j++}
   if(j<n){buf+='"';j++}o+=h+'<i class="s">'+esc(buf)+"</i>";i=j;continue}
  if("[](),".includes(c)){o+=c;i++;continue}
  if(c===":"||c==="|"){o+='<i class="o">'+c+"</i>";i++;continue}
  if(c===" "||c==="\t"){o+=c;i++;continue}
  const lit=S.lexLiteral(s,i);if(lit){o+='<i class="l">'+esc(s.slice(i,i+lit.length))+"</i>";i+=lit.length;continue}
  let j=i;while(j<n&&!' \t[](),|:"'.includes(s[j])&&!(s[j]==="-"&&s[j+1]==="-"&&j>i))j++;
  const w=s.slice(i,j);o+=/^-?\d+(\.\d+)?$/.test(w)?'<i class="n">'+w+"</i>":WORDS.has(w)?'<i class="a">'+esc(w)+"</i>":(w==="true"||w==="false"||w==="!")?'<i class="k">'+esc(w)+"</i>":esc(w);i=j}
  return o;
}
root.Sprout3Highlight = { line, esc };
})(typeof window !== "undefined" ? window : globalThis);
