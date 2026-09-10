import sys,collections
ids=set(open('ids-now.txt').read().split())
names=set(x.strip().lower() for x in open('names-now.txt') if x.strip())
batches=sys.argv[1:]
allids=set(ids); allnames=set(names); pairs=set(); probs=0; total=0
# preload live pairs
for ln in open('recipes-good.txt'):
    ln=ln.strip()
    if '=' in ln and '+' in ln:
        lhs=ln.split('=')[0]
        a,b=lhs.split('+')[:2]
        pairs.add(tuple(sorted((a.strip(),b.strip()))))
for bf in batches:
    for i,ln in enumerate(open(bf)):
        ln=ln.strip()
        if not ln or ln.startswith('#'): continue
        f=ln.split('|')
        if len(f)!=6: print(f'{bf}:{i+1} BADFIELDS {len(f)}'); probs+=1; continue
        eid,name,emoji,tags,wiki,rec=f
        if eid in allids: print(f'{bf}:{i+1} DUPID {eid}'); probs+=1
        if name.lower() in allnames: print(f'{bf}:{i+1} DUPNAME {name}'); probs+=1
        if '+' not in rec: print(f'{bf}:{i+1} BADREC {rec}'); probs+=1; continue
        a,b=[x.strip() for x in rec.split('+')[:2]]
        for ing in (a,b):
            if ing not in allids: print(f'{bf}:{i+1} MISSING-ING {ing} (for {eid})'); probs+=1
        key=tuple(sorted((a,b)))
        if key in pairs: print(f'{bf}:{i+1} PAIRDUP {a}+{b} (for {eid})'); probs+=1
        pairs.add(key)
        allids.add(eid); allnames.add(name.lower()); total+=1
print(f'{total} total so far; problems: {probs}')
