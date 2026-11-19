// Sprout 2.0 compiler (Sprout -> JS) and runtime, copied from 2026experiments/pm-tools/sprout2-ide.html.
// Small fixes for Sprout Live, each marked "Sprout Live fix N" in the code:
//  1. a := inside a selection branch, like  x > 0 [count := count + 1, 0], now runs (it was dropped).
//  2. [| ... ] is always a zero-argument block, as the v2 docs describe, even when every line is a call.
//  3. inside each/collect bodies, := updates the outer field and  list 2 := v  stores into the list.
//  4. each/collect run a tail call left pending at the end of their block (a final  beep 880 0.1  was skipped).
//  5. a named item, as in  xs each [d | ...], is bound in every loop (it was only bound inside other blocks).
//  6. a.b.c reads every level of a nested record (it read only the first).
//  7. a block with two or more inputs given just one value waits for the rest (add 1 gave NaN).
// Sprout Live additions, each marked "Sprout Live addition X":
//  A. a new line is a new step and a comma is a new item, so [ ... ] over several lines is a block, and [1, 2] is a list.
//  B. records: {x : 1, y : 2}
//  C. dots read and change fields: d.x, d.x := 5, _.y
//  D. string templates: "{score} drops" puts a value into a string. \{ is a plain brace.
//  E. and, or, not: (a > 1) and (b < 2), over not
var SproutToJS=(function(){"use strict";

function tokenize(src){
  const toks=[];let i=0;const n=src.length;
  const ESC={n:"\n",t:"\t","\\":"\\",'"':'"'};
  while(i<n){
    const c=src[i];
    if(c===" "||c==="\t"||c==="\r"){i++;continue}
    if(c==="\n"){toks.push("\n");i++;continue}/* Sprout Live addition A */
    // -- comments (Sprout 2.0)
    if(c==="-"&&i+1<n&&src[i+1]==="-"){i+=2;while(i<n&&src[i]!=="\n")i++;continue}
    // Legacy ' comments (backward compat)
    if(c==="'"){i++;while(i<n&&src[i]!=="'")i++;i++;continue}
    if(c==='"'){let j=i+1;const buf=[],parts=[];
      while(j<n&&src[j]!=='"'){
        if(src[j]==="\\"&&j+1<n){const x=src[j+1];buf.push(ESC[x]!==undefined?ESC[x]:x);j+=2}
        else if(src[j]==="{"){/* Sprout Live addition D: "{expr}" inside a string */
          let d=1,k=j+1;while(k<n&&d&&src[k]!=='"'){if(src[k]==="{")d++;else if(src[k]==="}")d--;if(d)k++}
          if(d)throw new Error("a { in a string needs a } to close it");
          parts.push(buf.join(""));buf.length=0;parts.push({src:src.slice(j+1,k)});j=k+1}
        else{buf.push(src[j]);j++}}
      if(parts.length){parts.push(buf.join(""));toks.push({k:"str",v:parts.map(p=>typeof p==="string"?p:"{"+p.src+"}").join(""),parts})}
      else toks.push({k:"str",v:buf.join("")});i=j+1;continue}
    if("[](){}".includes(c)){toks.push(c);i++;continue}
    if(",|".includes(c)){toks.push(c);i++;continue}
    // := mutation token (Sprout 2.0)
    if(c===":"&&i+1<n&&src[i+1]==="="){toks.push(":=");i+=2;continue}
    if(c===":"){toks.push(c);i++;continue}
    let j=i;
    while(j<n&&!" \t\r\n".includes(src[j])&&!'[](){}",|:'.includes(src[j])&&!(src[j]==="'"&&j>i)&&!(src[j]==="-"&&j+1<n&&src[j+1]==="-"))j++;
    if(j===i){j=i+1}
    toks.push({k:"word",v:src.slice(i,j)});i=j;
  }
  return toks;
}

const Lit=v=>({t:"Lit",v}),Name=n=>({t:"Name",n}),Send=(tgt,m)=>({t:"Send",tgt,m}),Block=()=>({t:"Block",params:[],body:[],group:false}),SetN=(key,val,mut)=>({t:"Set",key,val,mut:!!mut});
const isWord=x=>x&&typeof x==="object"&&x.k==="word",isStr=x=>x&&typeof x==="object"&&x.k==="str";
const NUM=/^-?\d+(\.\d+)?$/;

class Parser{
  constructor(t){this.t=t;this.i=0}
  pk(){return this.i<this.t.length?this.t[this.i]:null}
  nx(){return this.t[this.i++]}
  program(){return this.seq(null)}
  seq(end){
    const items=[];
    while(true){
      const t=this.pk();
      if(t===null||t===end)break;
      if(t===","||t==="\n"){if(t===",")this._comma=true;this.nx();continue}
      items.push(this.exprOrSet());
    }
    return items;
  }
  exprOrSet(){
    const left=this.chain();
    if(this.pk()===":"){this.nx();return SetN(left,this.chain(),false)}
    if(this.pk()===":="){this.nx();return SetN(left,this.chain(),true)}
    return left;
  }
  chain(){
    let node=this.primary();
    while(true){
      const t=this.pk();
      if(t===null||t===","||t==="\n"||t===":"||t===":="||t==="|"||t==="]"||t===")"||t==="}")break;
      node=Send(node,this.primary());
    }
    return node;
  }
  primary(){
    const t=this.nx();
    if(t==="[")return this.block("]");
    if(t==="("){const b=this.block(")");b.group=true;return b}
    if(t==="{")return this.record();/* Sprout Live addition B */
    if(isStr(t)&&t.parts){/* Sprout Live addition D: "a {x} b" is ("a " ++ (x str)) ++ " b" */
      let node=null;
      for(const p of t.parts){
        let part;
        if(typeof p==="string"){if(!p)continue;part=Lit(p)}
        else{const items=new Parser(tokenize(p.src)).program();if(items.length!==1)throw new Error("put one value inside { } in a string");
          const g=Block();g.group=true;g.body=[Send(items[0],Name("str"))];part=g}
        node=node?Send(Send(node,Name("++")),part):(typeof p==="string"?part:Send(Send(Lit(""),Name("++")),part));
      }
      return node||Lit("");
    }
    if(isStr(t))return Lit(t.v);
    if(isWord(t)){
      if(NUM.test(t.v))return Lit(parseFloat(t.v));
      if(/^[A-Za-z_@][\w-]*(\.[A-Za-z_][\w-]*)+$/.test(t.v)){/* Sprout Live addition C: d.x reads field x of d */
        const parts=t.v.split(".");let node=Name(parts[0]);
        for(const p of parts.slice(1)){if(node.t==="Send"){const g=Block();g.group=true;g.body=[node];node=g}node=Send(node,Lit(p))}/* Sprout Live fix 6: a.b.c reads every level */
        return node;
      }
      return Name(t.v);
    }
    throw new Error("unexpected: "+JSON.stringify(t));
  }
  record(){/* Sprout Live addition B: {x : 1, y : 2} is a record */
    const r={t:"Rec",fields:[]};
    while(true){
      const x=this.pk();
      if(x===null)break;
      if(x===","||x==="\n"){this.nx();continue}
      if(x==="}"){this.nx();break}
      if(!isWord(x)||this.t[this.i+1]!==":")throw new Error("records look like {x : 1, y : 2}");
      this.nx();this.nx();
      r.fields.push(SetN(Name(x.v),this.chain(),false));
    }
    return r;
  }
  block(close){
    const b=Block();
    let depth=0,j=this.i,hasBar=false;
    while(j<this.t.length){
      const x=this.t[j];
      if(typeof x==="string"){
        if(x==="["||x==="(")depth++;
        else if(x==="]"||x===")"){if(depth===0&&x===close)break;depth--}
        else if(x==="|"&&depth===0){hasBar=true;break}
      }
      j++;
    }
    if(hasBar){b.bar=true;/* Sprout Live fix 2 */
      while(true){
        const x=this.pk();
        if(x==="|"){this.nx();break}
        if(x===","||x==="\n"){this.nx();continue}
        if(isWord(x)){b.params.push(x.v);this.nx()}
        else this.nx();
      }
    }
    const sc=this._comma;this._comma=false;b.body=this.seq(close);b.commas=this._comma;this._comma=sc;
    if(this.pk()===close)this.nx();
    return b;
  }
}

const OPS={"+":"+","-":"-","*":"*","/":"/","<":"<",">":">","%":"%","<=":"<=",">=":">=","!=":"!=="},CMP=new Set(["<",">","<=",">=","!="]);

function mangle(name){
  if(name==="_"||name==="@")return"IT";
  let out=[];
  for(const ch of name){
    if(/[A-Za-z0-9_]/.test(ch))out.push(ch);
    else out.push("_"+ch.charCodeAt(0).toString(16));
  }
  let s=out.join("");
  if(s&&/[0-9]/.test(s[0]))s="_"+s;
  return"v_"+s;
}

function strlit(s){
  let out="'";
  for(const ch of s){
    if(ch==="\\")out+="\\\\";else if(ch==="'")out+="\\'";else if(ch==="\n")out+="\\n";else if(ch==="\t")out+="\\t";else if(ch==="\r")out+="\\r";else out+=ch;
  }
  return out+"'";
}

const FLAGNAMES=new Set(["pure","memoize","immutable","shared","lazy"]),
      BUILTIN=new Set(["not","print","length","first","second","append","each","collect","fold","times","while","sqrt","floor","str","last","round","ceil","abs","sin","cos","tan","log"]),
      OPSET=new Set([...Object.keys(OPS),"=","++","and","or"]);

class Gen{
  constructor(){this._self=null;this._declared=new Set();this._lists=new Set();this._maps=new Set();this._fns=new Set();this._dense=new Set();this._arity=new Map();this._mayPromote=new Set()}

  scanMayPromote(node){
    if(!node||typeof node!=="object")return;
    if(node.t==="Set"&&node.key&&node.key.t==="Send"&&node.key.tgt&&node.key.tgt.t==="Name"&&this.litStringKey(node.key.m))this._mayPromote.add(node.key.tgt.n);
    for(const k in node){const v=node[k];if(Array.isArray(v))v.forEach(x=>this.scanMayPromote(x));else if(v&&typeof v==="object"&&v.t)this.scanMayPromote(v)}
  }

  genProgram(items){
    items.forEach(it=>this.scanMayPromote(it));
    return items.map(it=>this.genStmt(it)).filter(p=>p).join(";\n");
  }

  peelFlags(node){
    const flags=new Set();
    while(node.t==="Send"&&node.m.t==="Name"&&FLAGNAMES.has(node.m.n)){flags.add(node.m.n);node=node.tgt}
    return[node,flags];
  }

  producesList(node){
    if(node.t==="Block"&&!node.group&&this.isListLiteral(node))return true;
    if(node.t==="Send"){
      if(node.tgt.t==="Name"&&(node.tgt.n==="range"||node.tgt.n==="list"))return true;
      const inner=node.tgt;
      if(inner.t==="Send"&&inner.m.t==="Name"&&(inner.m.n==="collect"||inner.m.n==="append"))return true;
    }
    return false;
  }

  litStringKey(node){
    while(node&&node.t==="Block"&&node.group&&node.body.length===1)node=node.body[0];
    return(node&&node.t==="Lit"&&typeof node.v==="string")?node:null;
  }

  genStore(k,valnode){
    const tgtNode=k.tgt,idx=this.genExpr(k.m),val=this.genExpr(valnode);
    if(tgtNode.t==="Name"&&this._maps.has(tgtNode.n))return`${mangle(tgtNode.n)}.set(${idx},${val})`;
    if(tgtNode.t==="Name"&&(this._dense.has(tgtNode.n)||this._lists.has(tgtNode.n))){
      if(this.litStringKey(k.m))return`${mangle(tgtNode.n)} = STORE(${mangle(tgtNode.n)},${idx},${val})`;
      if(this._mayPromote.has(tgtNode.n))return`${mangle(tgtNode.n)} = STORE(${mangle(tgtNode.n)},${idx},${val})`;
      return`(${mangle(tgtNode.n)}[${idx}]=${val})`;
    }
    return`STORE(${this.genExpr(tgtNode)},${idx},${val})`;
  }

  genStmt(node){
    if(node.t==="Set"){
      const key=node.key.t==="Name"?node.key.n:null;
      if(key===null){
        if(node.key.t==="Send")return this.genStore(node.key,node.val);
        throw new Error("unsupported set key");
      }
      // := mutation: always reassign, never declare
      if(node.mut){
        const expr=this.genExpr(node.val);
        return`${mangle(key)} = ${expr}`;
      }
      const[core,flags]=this.peelFlags(node.val);
      const isFnBlock=core.t==="Block"&&!core.group&&!this.isListLiteral(core)&&!flags.has("memoize")&&!flags.has("pure");
      if(isFnBlock){this._fns.add(key);this._arity.set(key,core.params.length?core.params.length:(this.usesImplicit(core.body)?1:0))}
      let expr;
      if(core.t==="Block"&&!core.group&&!flags.has("memoize")&&!flags.has("pure")){
        if(this.isListLiteral(core))expr=this.genList(core);
        else{const params=core.params.length?core.params:(this.usesImplicit(core.body)?["_"]:[]);expr=this.genBlockAsLoop(core,key,params)}
      }else{
        expr=this.genExpr(core);
        if(flags.has("memoize")||flags.has("pure"))expr=`MEMO(${expr})`;
      }
      if(this.producesList(core)||(core.t==="Block"&&this.isListLiteral(core)))this._lists.add(key);else if(this._lists.has(key))this._lists.delete(key);
      if(core.t==="Send"&&core.tgt.t==="Name"&&(core.tgt.n==="list"||core.tgt.n==="range"))this._dense.add(key);else if(this._dense.has(key))this._dense.delete(key);
      if(core.t==="Name"&&core.n==="map")this._maps.add(key);else if(this._maps.has(key))this._maps.delete(key);
      if(!isFnBlock){this._fns.delete(key);this._arity.delete(key)}
      if(this._declared.has(key))return`${mangle(key)} = ${expr}`;
      this._declared.add(key);
      return`let ${mangle(key)} = ${expr}`;
    }
    const stmt=this.matchLoopVerbStmt(node);
    if(stmt!==null)return stmt;
    return this.genExpr(node);
  }

  matchLoopVerbStmt(node){
    if(node.t==="Send"&&node.m.t==="Block"&&!node.m.group){
      const inner=node.tgt;
      if(inner.t==="Send"&&inner.m.t==="Block"&&!inner.m.group&&inner.tgt.t==="Name"&&inner.tgt.n==="while"){
        const condblk=inner.m,bodyblk=node.m;
        let raw=null;
        if(condblk.body.length===1&&condblk.body[0].t!=="Set")raw=this.genRawBool(condblk.body[0]);
        const cond=raw!==null?raw:`(${this.genBlockInlineExpr(condblk)})===TRUE`;
        return`while(${cond}){${this.genBlockInlineStmts(bodyblk)}}`;
      }
      if(inner.t==="Send"&&inner.m.t==="Name"&&inner.m.n==="times"){
        const saved=new Set(this._declared);
        this._declared.add("_");this._declared.add("@");
        const body=this.genBlockInlineStmts(node.m);
        this._declared=saved;
        return`for(let __i=0;__i<(${this.genExpr(inner.tgt)});__i++){let IT=__i+1;${node.m.params&&node.m.params.length?`let ${mangle(node.m.params[0])}=IT;`:""}/* Sprout Live fix 5 */${body}}`;
      }
      if(inner.t==="Send"&&inner.m.t==="Name"&&inner.m.n==="each"){
        const xs=this.genExpr(inner.tgt);
        const saved=new Set(this._declared);
        this._declared.add("_");this._declared.add("@");
        const body=this.genBlockInlineStmts(node.m);
        this._declared=saved;
        return`{const __l=${xs};for(let __k=1;__k<__l.length;__k++){let IT=__l[__k];${node.m.params&&node.m.params.length?`let ${mangle(node.m.params[0])}=IT;`:""}/* Sprout Live fix 5 */${body}}}`;
      }
    }
    return null;
  }

  genBlockAsLoop(blk,selfname,params){
    const ps=params.map(mangle).join(",");
    this._self=[selfname,params];
    const saved=new Set(this._declared);
    for(const p of params)this._declared.add(p);
    const body=this.genBlockBody(blk.body);
    this._declared=saved;
    this._self=null;
    const fn=`((${ps})=>{while(true){${body}}})`;
    return params.length>1?`AR(${fn},${params.length})`:fn;
  }

  isListLiteral(node){
    if(node.t!=="Block"||node.group||node.params.length||node.bar/* Sprout Live fix 2 */)return false;
    if(node.body.length>=2&&!node.commas)return false;/* Sprout Live addition A: lines without commas are steps, not list items */
    if(this.usesImplicit(node.body))return false;
    if(node.body.some(e=>e.t==="Set"))return false;
    return node.body.length===0||node.body.length>=2;
  }

  genList(node){
    if(node.body.length===0)return`[0]`;
    return`[0,${node.body.map(e=>this.genExpr(e)).join(",")}]`;
  }

  genExpr(node,tail=false){
    if(node.t==="Rec")return`(new Map([${node.fields.map(f=>`[${strlit(f.key.n)},${this.genExpr(f.val)}]`).join(",")}]))`;/* Sprout Live addition B */
    if(node.t==="Lit")return typeof node.v==="number"?String(node.v):strlit(node.v);
    if(node.t==="Name"){
      const n=node.n;
      if(n==="true")return"TRUE";
      if(n==="false")return"FALSE";
      if(n==="none")return"NONE";
      if(n==="map")return"newmap()";
      if(n==="random")return"Math.random()";
      if(n==="time")return"Date.now()";
      if(n==="pi")return"Math.PI";
      return mangle(n);
    }
    if(node.t==="Block"){
      if(node.group){
        if(node.body.length===1&&node.body[0].t!=="Set")return this.genExpr(node.body[0],tail);
        const saved=this._self;this._self=null;
        const body=this.genBlockBody(node.body);
        this._self=saved;
        return`(()=>{${body}})()`;
      }
      if(this.isListLiteral(node))return this.genList(node);
      const params=node.params.length?node.params:(this.usesImplicit(node.body)?["_"]:[]);
      const saved=this._self;this._self=null;
      const savedd=new Set(this._declared);
      for(const p of params)this._declared.add(p);
      const body=this.genBlockBody(node.body);
      this._declared=savedd;this._self=saved;
      const fn=`((${params.map(mangle).join(",")})=>{${body}})`;
      return params.length>1?`AR(${fn},${params.length})`:fn;
    }
    if(node.t==="Send")return this.genSend(node,tail);
    throw new Error("node "+JSON.stringify(node));
  }

  // Check for _ or @ (backward compat) as implicit argument
  usesImplicit(body){
    const chk=n=>{
      if(n.t==="Name")return n.n==="_"||n.n==="@";
      if(n.t==="Send")return chk(n.tgt)||chk(n.m);
      if(n.t==="Set")return chk(n.val);
      if(n.t==="Block"&&n.group)return n.body.some(chk);
      if(n.t==="Rec")return n.fields.some(chk);
      return false;
    };
    return body.some(chk);
  }

  genRawBool(node){
    while(node.t==="Block"&&node.group&&node.body.length===1)node=node.body[0];
    if(node.t==="Send"&&node.tgt.t==="Send"&&node.tgt.m.t==="Name"){
      const opn=node.tgt.m.n;
      if(CMP.has(opn))return`(${this.genExpr(node.tgt.tgt)} ${OPS[opn]} ${this.genExpr(node.m)})`;
      if(opn==="=")return`REQ(${this.genExpr(node.tgt.tgt)},${this.genExpr(node.m)})`;
    }
    return null;
  }

  genCallback(blk){
    if(!(blk.t==="Block"&&!blk.group))return this.genExpr(blk);
    const params=blk.params.length?blk.params:(this.usesImplicit(blk.body)?["_"]:[]);
    const saved=this._self;this._self=null;
    const parts=[];
    for(let i=0;i<blk.body.length;i++){
      const it=blk.body[i],last=i===blk.body.length-1;
      if(it.t==="Set"){
        const key=it.key.t==="Name"?it.key.n:null;
        /* Sprout Live fix 3: inside each/collect bodies, := reassigns the outer field and  list 2 := v  stores into the list (they became new locals, or crashed) */
        if(key===null&&it.key.t==="Send"){parts.push(this.genStore(it.key,it.val)+";");if(last)parts.push("return NONE;");continue}
        parts.push(`${it.mut?"":"let "}${mangle(key)} = ${this.genExpr(it.val)};`);
        if(last)parts.push(`return ${mangle(key)};`);
      }else{
        parts.push((last?"return ":"")+this.genExpr(it,false)+";");
      }
    }
    this._self=saved;
    const fn=`((${params.map(mangle).join(",")})=>{${parts.length?parts.join(""):"return NONE;"}})`;
    return params.length>1?`AR(${fn},${params.length})`:fn;
  }

  genBlockBody(body){
    if(!body.length)return"return NONE;";
    const savedDecl=new Set(this._declared);
    const parts=[];
    for(let i=0;i<body.length;i++){
      const it=body[i],last=i===body.length-1;
      if(it.t==="Set"){
        const key=it.key.t==="Name"?it.key.n:null;
        if(key!==null){
          // := mutation always reassigns
          if(it.mut){
            parts.push(`${mangle(key)} = ${this.genExpr(it.val,false)};`);
          } else if(this._declared.has(key)){
            parts.push(`${mangle(key)} = ${this.genExpr(it.val,false)};`);
          } else{
            this._declared.add(key);
            parts.push(`let ${mangle(key)} = ${this.genExpr(it.val,false)};`);
          }
          if(last)parts.push(`return ${mangle(key)};`);
        }else if(it.key.t==="Send"){
          parts.push(this.genStore(it.key,it.val)+";");
          if(last)parts.push("return NONE;");
        }
      }else{
        if(last)parts.push(this.genTailStmt(it));
        else parts.push(this.genExpr(it,false)+";");
      }
    }
    this._declared=savedDecl;
    return parts.join("");
  }

  genTailStmt(node){
    while(node.t==="Block"&&node.group&&node.body.length===1&&node.body[0].t!=="Set")node=node.body[0];
    if(node.t==="Send"&&node.m.t==="Block"&&!node.m.group&&!node.m.params.length&&node.m.body.length===2&&this._self!==null){
      const raw=this.genRawBool(node.tgt);
      const cond=raw!==null?raw:`(${this.genExpr(node.tgt)})===TRUE`;
      return`if(${cond}){${this.genTailStmtElem(node.m.body[0])}}else{${this.genTailStmtElem(node.m.body[1])}}`;
    }
    const e=this.genExpr(node,true);
    if(e.startsWith("__LOOP__"))return e.slice(8)+"continue;";
    return`return ${e};`;
  }

  genTailStmtElem(e){if(e.t==="Set")e=e.val;return this.genTailStmt(e)}

  callSpine(node){
    const spine=[];let head=node;
    while(head.t==="Send"){
      const m=head.m;
      if(m.t==="Name"&&(OPSET.has(m.n)||BUILTIN.has(m.n)))return null;
      spine.push(m);head=head.tgt;
    }
    if(spine.length>=2&&head.t==="Name"&&!["true","false","none"].includes(head.n)){
      spine.reverse();return[head,spine];
    }
    return null;
  }

  matchLoopVerb(node){
    if(node.t==="Send"&&node.m.t==="Block"&&!node.m.group){
      const inner=node.tgt;
      if(inner.t==="Send"&&inner.m.t==="Block"&&!inner.m.group&&inner.tgt.t==="Name"&&inner.tgt.n==="while"){
        const condblk=inner.m,bodyblk=node.m;
        let raw=null;
        if(condblk.body.length===1&&condblk.body[0].t!=="Set")raw=this.genRawBool(condblk.body[0]);
        return`(()=>{while(${raw!==null?raw:`(${this.genBlockInlineExpr(condblk)})===TRUE`}){${this.genBlockInlineStmts(bodyblk)}}return NONE;})()`;
      }
      if(inner.t==="Send"&&inner.m.t==="Name"&&inner.m.n==="times"){
        const saved=new Set(this._declared);
        this._declared.add("_");this._declared.add("@");
        const body=this.genBlockInlineStmts(node.m);
        this._declared=saved;
        return`(()=>{for(let __i=0;__i<(${this.genExpr(inner.tgt)});__i++){let IT=__i+1;${node.m.params&&node.m.params.length?`let ${mangle(node.m.params[0])}=IT;`:""}/* Sprout Live fix 5 */${body}}return NONE;})()`;
      }
      if(inner.t==="Send"&&inner.m.t==="Name"&&inner.m.n==="each"){
        return`(()=>{const __l=${this.genExpr(inner.tgt)},__f=${this.genCallback(node.m)};for(let __k=1;__k<__l.length;__k++){RUN(__f(__l[__k]));/* Sprout Live fix 4 */}return NONE;})()`;
      }
      if(inner.t==="Send"&&inner.m.t==="Name"&&inner.m.n==="collect"){
        return`(()=>{const __l=${this.genExpr(inner.tgt)},__o=[0],__f=${this.genCallback(node.m)};for(let __k=1;__k<__l.length;__k++){__o.push(RUN(__f(__l[__k])));/* Sprout Live fix 4 */}return __o;})()`;
      }
    }
    if(node.t==="Send"&&node.m.t==="Block"&&!node.m.group){
      const i2=node.tgt;
      if(i2.t==="Send"&&i2.tgt.t==="Send"&&i2.tgt.m.t==="Name"&&i2.tgt.m.n==="fold"){
        return`(()=>{const __l=${this.genExpr(i2.tgt.tgt)},__f=${this.genCallback(node.m)};let __a=${this.genExpr(i2.m)};for(let __k=1;__k<__l.length;__k++){__a=__f(__a,__l[__k]);}return __a;})()`;
      }
    }
    return null;
  }

  provenList(node){
    while(node&&node.t==="Block"&&node.group&&node.body.length===1)node=node.body[0];
    if(node.t==="Name")return!this._mayPromote.has(node.n)&&(this._dense.has(node.n)||(this._lists.has(node.n)&&!this._maps.has(node.n)));
    if(node.t==="Send"&&node.tgt.t==="Name"&&(node.tgt.n==="range"||node.tgt.n==="list"))return true;
    if(node.t==="Send"&&node.m.t==="Name"&&(node.m.n==="collect"||node.m.n==="append"))return true;
    if(node.t==="Block"&&this.isListLiteral(node))return true;
    return false;
  }

  genBlockInlineExpr(blk){
    if(blk.body.length===1&&blk.body[0].t!=="Set"){
      const saved=this._self;this._self=null;
      const r=this.genExpr(blk.body[0]);
      this._self=saved;return r;
    }
    const saved=this._self;this._self=null;
    const b=this.genBlockBody(blk.body);
    this._self=saved;
    return`(()=>{${b}})()`;
  }

  genBlockInlineStmts(blk){
    const saved=this._self;this._self=null;
    const parts=[];
    for(const it of blk.body){
      if(it.t==="Set"){
        const key=it.key.t==="Name"?it.key.n:null;
        if(key===null&&it.key.t==="Send"){parts.push(this.genStore(it.key,it.val)+";");continue}
        const val=this.genExpr(it.val);
        if(it.mut||this._declared.has(key))parts.push(`${mangle(key)} = ${val};`);
        else{this._declared.add(key);parts.push(`let ${mangle(key)} = ${val};`)}
      }else parts.push(this.genLoopStmt(it));
    }
    this._self=saved;
    return parts.join("");
  }

  genLoopStmt(node){
    const lv=this.matchLoopVerbStmt(node);
    if(lv!==null)return lv;
    let sel=node;
    while(sel.t==="Block"&&sel.group&&sel.body.length===1)sel=sel.body[0];
    if(sel.t==="Block"&&sel.group&&sel.body.length>1){
      const parts=[];
      for(const it of sel.body){
        if(it.t==="Set"){
          const key=it.key.t==="Name"?it.key.n:null;
          if(key===null&&it.key.t==="Send"){parts.push(this.genStore(it.key,it.val)+";");continue}
          const val=this.genExpr(it.val);
          if(it.mut||this._declared.has(key))parts.push(`${mangle(key)} = ${val};`);
          else{this._declared.add(key);parts.push(`let ${mangle(key)} = ${val};`)}
        }else{
          const lv2=this.matchLoopVerbStmt(it);
          parts.push(lv2!==null?lv2:this.genLoopStmt(it));
        }
      }
      return parts.join("");
    }
    if(sel.t==="Send"&&sel.m.t==="Block"&&!sel.m.group&&!sel.m.params.length&&sel.m.body.length===2){
      const raw=this.genRawBool(sel.tgt);
      return`if(${raw!==null?raw:`(${this.genExpr(sel.tgt)})===TRUE`}){${this.genBranchStmt(sel.m.body[0])}}else{${this.genBranchStmt(sel.m.body[1])}}`;
    }
    return this.genExpr(node)+";";
  }

  genBranchStmt(e){
    if(e.t==="Block"&&e.group&&e.body.length>1)return this.genLoopStmt(e);
    if(e.t==="Set"){
      const key=e.key.t==="Name"?e.key.n:null;
      if(key===null&&e.key.t==="Send")return this.genStore(e.key,e.val)+";";
      const val=this.genExpr(e.val);
      if(e.mut||this._declared.has(key))return`${mangle(key)} = ${val};`;
      this._declared.add(key);
      return`let ${mangle(key)} = ${val};`;
    }
    return this.genExpr(e)+";";
  }

  genSend(node,tail=false){
    if(node.tgt.t==="Name"&&node.tgt.n==="range")return`RANGE(${this.genExpr(node.m)})`;
    if(node.tgt.t==="Name"&&node.tgt.n==="list")return`ZEROS(${this.genExpr(node.m)})`;
    const lp=this.matchLoopVerb(node);
    if(lp!==null)return lp;
    const cs=this.callSpine(node);
    if(cs!==null){
      const[head,spine]=cs;
      if(tail&&this._self&&head.n===this._self[0]&&spine.length===this._self[1].length){
        const params=this._self[1],tmps=spine.map(a=>this.genExpr(a));
        return`__LOOP__{${tmps.map((t,i)=>`let __t${i}=${t};`).join("")}${params.map((p,i)=>`${mangle(p)}=__t${i};`).join("")}}`;
      }
      const callee=this.genExpr(head),args=spine.map(a=>this.genExpr(a)).join(",");
      if(!tail&&head.t==="Name"&&this._arity.get(head.n)===spine.length)return`${callee}(${args})`;
      if(tail)return`TCN(${callee},[${args}])`;
      return`APPLY(${callee},[${args}])`;
    }
    const inner=node.tgt;
    if(inner.t==="Send"&&inner.m.t==="Name"&&(inner.m.n in OPS)){
      const opn=inner.m.n,L=this.genExpr(inner.tgt),R=this.genExpr(node.m);
      return CMP.has(opn)?`((${L} ${OPS[opn]} ${R})?TRUE:FALSE)`:`(${L} ${OPS[opn]} ${R})`;
    }
    if(inner.t==="Send"&&inner.m.t==="Name"&&(inner.m.n==="and"||inner.m.n==="or")){/* Sprout Live addition E */
      const a=this.genExpr(inner.tgt),b=this.genExpr(node.m);
      return inner.m.n==="and"?`((${a})===TRUE?(${b}):FALSE)`:`((${a})===TRUE?TRUE:(${b}))`;
    }
    if(inner.t==="Send"&&inner.m.t==="Name"&&inner.m.n==="=")return`eq(${this.genExpr(inner.tgt)},${this.genExpr(node.m)})`;
    if(inner.t==="Send"&&inner.m.t==="Name"&&inner.m.n==="++")return`((${this.genExpr(inner.tgt)})+(${this.genExpr(node.m)}))`;
    if(inner.t==="Send"&&inner.m.t==="Name"&&inner.m.n==="append")return`(${this.genExpr(inner.tgt)}).concat([${this.genExpr(node.m)}])`;
    if(node.m.t==="Name"){
      const m=node.m.n;
      if(m==="dom")return`v_dom(${this.genExpr(node.tgt)})`;
      if(m==="css")return`v_css(${this.genExpr(node.tgt)})`;
      if(m==="prompt")return`v_prompt(${this.genExpr(node.tgt)})`;
      if(m==="print")return`prnt(${this.genExpr(node.tgt)})`;
      if(m==="not")return`((${this.genExpr(node.tgt)})===TRUE?FALSE:TRUE)`;/* Sprout Live addition E */
      if(m==="length")return`LEN(${this.genExpr(node.tgt)})`;
      if(m==="sqrt")return`Math.sqrt(${this.genExpr(node.tgt)})`;
      if(m==="floor")return`Math.floor(${this.genExpr(node.tgt)})`;
      if(m==="round")return`Math.round(${this.genExpr(node.tgt)})`;
      if(m==="ceil")return`Math.ceil(${this.genExpr(node.tgt)})`;
      if(m==="abs")return`Math.abs(${this.genExpr(node.tgt)})`;
      if(m==="sin")return`Math.sin(${this.genExpr(node.tgt)})`;
      if(m==="cos")return`Math.cos(${this.genExpr(node.tgt)})`;
      if(m==="tan")return`Math.tan(${this.genExpr(node.tgt)})`;
      if(m==="log")return`Math.log(${this.genExpr(node.tgt)})`;
      if(m==="str")return`fmt(${this.genExpr(node.tgt)})`;
      if(m==="last"){const t=this.genExpr(node.tgt);return this.provenList(node.tgt)?`(${t})[(${t}).length-1]`:`LAST(${t})`}
      if(m==="first"){const t=this.genExpr(node.tgt);return this.provenList(node.tgt)?`(${t})[1]`:`CALL(${t},1)`}
      if(m==="second"){const t=this.genExpr(node.tgt);return this.provenList(node.tgt)?`(${t})[2]`:`CALL(${t},2)`}
      if((m in OPS)||m==="="||m==="++"){
        const t=this.genExpr(node.tgt);
        if(CMP.has(m))return`((R)=>((${t}) ${OPS[m]} R)?TRUE:FALSE)`;
        if(m in OPS)return`((R)=>((${t}) ${OPS[m]} R))`;
        if(m==="=")return`((R)=>eq(${t},R))`;
        if(m==="++")return`((R)=>((${t})+R))`;
      }
      const argname=({true:"TRUE",false:"FALSE",none:"NONE"})[m]||mangle(m);
      const t=this.genExpr(node.tgt);
      return tail?`TC(${t}, ${argname})`:`RUN(SEND(${t}, ${argname}))`;
    }else{
      const mIsData=node.tgt.t==="Name"&&this._fns.has(node.tgt.n)&&node.m.t==="Block"&&!node.m.group&&!node.m.params.length&&this.isListLiteral(node.m);
      if(node.m.t==="Block"&&!node.m.group&&!node.m.params.length&&!mIsData){
        const t=this.genExpr(node.tgt),elems=node.m.body;
        if(elems.length===2){
          const a=this.genExprThunkelem(elems[0],tail),b=this.genExprThunkelem(elems[1],tail),raw=this.genRawBool(node.tgt);
          return raw!==null?`((${raw})?(${a}):(${b}))`:`((${t})===TRUE?(${a}):(${b}))`;
        }
        if(elems.length===1)return`((${this.genExpr(node.tgt)})===TRUE?(${this.genExprThunkelem(elems[0],tail)}):NONE)`;
        const thunks=elems.map(e=>"()=>"+this.genExprThunkelem(e,tail)).join(",");
        return tail?`SELT(${t}, [${thunks}])`:`RUN(SELT(${t}, [${thunks}]))`;
      }
      if(node.tgt.t==="Name"&&this._lists.has(node.tgt.n)){
        if(this.litStringKey(node.m))return`CALL(${mangle(node.tgt.n)},${this.genExpr(node.m)})`;
        const a=this.genExpr(node.m);
        if(this._mayPromote.has(node.tgt.n))return`CALL(${mangle(node.tgt.n)},${a})`;
        return this._dense.has(node.tgt.n)?`${mangle(node.tgt.n)}[${a}]`:`(${mangle(node.tgt.n)}[${a}]??NONE)`;
      }
      if(node.tgt.t==="Name"&&this._maps.has(node.tgt.n))return`(${mangle(node.tgt.n)}.get(${this.genExpr(node.m)})??NONE)`;
      const t=this.genExpr(node.tgt),a=this.genExpr(node.m);
      if(!tail&&node.tgt.t==="Name"&&this._arity.get(node.tgt.n)===1)return`${t}(${a})`;
      return tail?`TC(${t}, ${a})`:`RUN(CALL(${t}, ${a}))`;
    }
  }

  /* Sprout Live fix 1 */genExprThunkelem(e,tail=false){return e.t==="Set"?this.genExpr({t:"Block",params:[],body:[e],group:true},tail):this.genExpr(e,tail)}
}

function compile(src){return new Gen().genProgram(new Parser(tokenize(src)).program())}
return{compile};
})();

var SproutRuntime=(function(){"use strict";const NONE=Symbol("none"),TRUE={sel:0},FALSE={sel:1};const eq=(a,b)=>(a===b)?TRUE:FALSE,REQ=(a,b)=>(a===b);function RANGE(n){const a=new Float64Array(n+1);for(let i=1;i<=n;i++)a[i]=i;return a}function ZEROS(n){return new Float64Array(n+1)}function newmap(){return new Map()}function LEN(x){if(typeof x==="string")return x.length;if(Array.isArray(x)||ArrayBuffer.isView(x))return x.length-1;return 0}function LAST(x){if(typeof x==="string")return x.length?x[x.length-1]:NONE;const n=LEN(x);return n>=1?CALL(x,n):NONE}function STORE(t,k,v){if(Array.isArray(t)&&typeof k==="number"){while(t.length<=k)t.push(NONE);t[k]=v;return v}if(t instanceof Map){t.set(k,v);return v}return v}function fmt(x){if(x===NONE)return"none";if(x===TRUE)return"true";if(x===FALSE)return"false";if(typeof x==="number")return String(x);if(typeof x==="string")return x;if(typeof x==="function")return"[block]";if(x instanceof Map)return"{"+Array.from(x).map(([k,v])=>k+" : "+fmt(v)).join(", ")+"}";if(Array.isArray(x)||ArrayBuffer.isView(x))return"["+Array.from(x).slice(1).map(fmt).join(", ")+"]";return String(x)}function CALL(t,a){if(t===TRUE||t===FALSE){if(Array.isArray(a))return(a[t.sel]!==undefined)?a[t.sel]():NONE;return NONE}if(Array.isArray(t)||ArrayBuffer.isView(t))return typeof a==="number"&&a>=1&&a<t.length?t[a]:NONE;if(t instanceof Map)return t.has(a)?t.get(a):NONE;if(typeof t==="function")return(t.L||1)>1?invoke(t,[a]):t(a);/* Sprout Live fix 7 */return NONE}function SEND(t,arg){if(typeof t==="function")return RUN(t(arg));if(Array.isArray(t)||ArrayBuffer.isView(t)||t instanceof Map)return CALL(t,arg);return NONE}class Bounce{constructor(fn,args){this.fn=fn;this.args=args}}function RUN(v){while(v instanceof Bounce)v=v.fn(...v.args);return v}function AR(fn,n){fn.L=n;return fn}function invoke(fn,args){if(typeof fn!=="function")return args.length?CALL(fn,args[0]):fn;const L=fn.L||1;if(args.length===L)return fn(...args);if(args.length<L){const got=args.slice();const g=(...more)=>invoke(fn,got.concat(more));g.L=L-args.length;return g}return invoke(RUN(fn(...args.slice(0,L))),args.slice(L))}function APPLY(fn,args){if(typeof fn==="function"&&(fn.L||1)===args.length)return RUN(fn(...args));return RUN(invoke(fn,args))}function TCN(fn,args){if(typeof fn==="function"&&(fn.L||1)===args.length)return new Bounce(fn,args);return invoke(fn,args)}function TC(t,arg){if(typeof t==="function"&&(t.L||1)===1)return new Bounce(t,[arg]);return CALL(t,arg)}function SELT(boolv,thunks){if(boolv===TRUE||boolv===FALSE){const i=boolv.sel;return thunks[i]!==undefined?thunks[i]():NONE}return NONE}function MEMO(fn){const L=fn.L||1,cache=new Map();const w=(...args)=>{const key=args.map(keyOf).join("");if(cache.has(key))return cache.get(key);const val=RUN(fn(...args));cache.set(key,val);return val};w.L=L;return w}function keyOf(a){if(a===TRUE)return"T";if(a===FALSE)return"F";if(a===NONE)return"N";return(typeof a)+":"+String(a)}return{NONE,TRUE,FALSE,eq,REQ,RANGE,ZEROS,newmap,LEN,LAST,STORE,fmt,CALL,SEND,Bounce,RUN,AR,invoke,APPLY,TCN,TC,SELT,MEMO,keyOf}})();
if(typeof module!=="undefined")module.exports={SproutToJS,SproutRuntime};
