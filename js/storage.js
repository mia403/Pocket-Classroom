// storage.js
export const storage = {
    readIndex(){ try{ return JSON.parse(localStorage.getItem('pc_capsules_index')||'[]'); }catch{ return []; }},
    writeIndex(idx){ localStorage.setItem('pc_capsules_index', JSON.stringify(idx)); },
    readCapsule(id){ try{ return JSON.parse(localStorage.getItem('pc_capsule_'+id)||'null'); }catch{ return null; } },
    writeCapsule(id, capsule){ localStorage.setItem('pc_capsule_'+id, JSON.stringify(capsule)); },
    removeCapsule(id){
      localStorage.removeItem('pc_capsule_'+id);
      localStorage.removeItem('pc_progress_'+id);
      const idx = this.readIndex().filter(x=>x.id!==id);
      this.writeIndex(idx);
    },
    readProgress(id){ try{ return JSON.parse(localStorage.getItem('pc_progress_'+id)||'{"bestScore":0,"knownFlashcards":[]}'); }catch{ return {bestScore:0, knownFlashcards:[]}; } },
    writeProgress(id, prog){ localStorage.setItem('pc_progress_'+id, JSON.stringify(prog)); },
  };
  