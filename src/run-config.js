'use strict';
const { definitions } = require('./languages');

// Commands are parsed to argv arrays so file placeholders never become shell code.
function parseRunConfig(text) {
  if (typeof text !== 'string' || /[\r\n\0]/.test(text)) throw new Error('Run Config must be a single line.');
  const commands=[]; let args=[], token='', started=false, quote='';
  const pushToken=()=>{ if(started) { args.push(token);token='';started=false; } };
  for(let i=0;i<text.length;i++) {
    const c=text[i];
    if(quote) {
      if(c===quote) quote='';
      else if(c==='\\' && quote==='"' && ['"','\\'].includes(text[i+1])) token+=text[++i];
      else token+=c;
      continue;
    }
    if(c==='"' || c==="'") { quote=c;started=true;continue; }
    if(/\s/.test(c)) { pushToken();continue; }
    if(c==='&' && text[i+1]==='&') {
      pushToken();if(!args.length) throw new Error('A command is missing before &&.');
      commands.push(args);args=[];i++;continue;
    }
    if(/[&|;<>]/.test(c)) throw new Error('Use && between commands. Shell operators require an explicit shell executor.');
    token+=c;started=true;
  }
  if(quote) throw new Error('Run Config contains an unclosed quote.');
  pushToken();if(!args.length) throw new Error('Run Config must end with a command.');
  commands.push(args);
  return commands.map((args,index)=>({executable:args[0],args:args.slice(1),kind:index<commands.length-1?'compile':'run'}));
}
function formatToken(value) { return /\s|["'&|;<>]/.test(value) ? JSON.stringify(value) : value; }
function defaultRunConfig(id,platform) {
  const entry=definitions.find(language=>language.id===id);
  if(!entry) throw new Error('Unknown programming language: '+id);
  const steps=[];
  if(entry.compile) steps.push(entry.compile);
  const executable=platform==='win32'?entry.windowsExecutable||entry.executable:entry.unixExecutable||entry.executable;
  steps.push({executable,args:entry.args});
  return steps.map(step=>[step.executable,...step.args].map(token=>formatToken(token.replaceAll('{file}','{filename}'))).join(' ')).join(' && ');
}

// Synchronizes the two Settings fields while storing independent language profiles.
class RunConfigEditor {
  constructor({platform,state,read,write,persist,report}) {
    this.platform=platform;this.state=state||{commands:{}};this.state.commands ||= {};
    this.read=read;this.write=write;this.persist=persist;this.report=report;
    this.pending=[];this.queue=Promise.resolve();
  }
  async initialize() {
    const selected=this.read('programmingLanguage')||'c';
    const text=this.read('runConfig')||'';
    if(this.state.selected===selected && text && text!==this.state.rendered) await this.save(selected,text);
    else if(!this.state.selected && text) await this.save(selected,text);
    this.state.selected=selected;
    await this.render(selected);
  }
  onChange(languageChanged,textChanged) {
    const selected=this.read('programmingLanguage')||'c';
    const text=this.read('runConfig')||'';
    if(textChanged) {
      const internal=this.pending.findIndex(value=>value.text===text);
      if(internal!==-1) { this.pending.splice(internal,1);textChanged=false; }
    }
    this.queue=this.queue.then(async()=>{
      if(textChanged) await this.save(selected,text);
      this.state.selected=selected;
      if(languageChanged) await this.render(selected);
    }).catch(error=>this.report(error.message));
    return this.queue;
  }
  async save(selected,text) {
    if(text.trim() && text!==defaultRunConfig(selected,this.platform)) {
      parseRunConfig(text);
      this.state.commands[selected]=text;
    } else delete this.state.commands[selected];
    this.state.rendered=text;
    await this.persist(this.state);
  }
  async render(selected) {
    if(this.read('programmingLanguage')!==selected) return;
    const text=this.state.commands[selected]||defaultRunConfig(selected,this.platform);
    this.state.selected=selected;this.state.rendered=text;
    await this.persist(this.state);
    if(this.read('runConfig')!==text) {
      const pending={selected,text};this.pending.push(pending);
      try { await this.write(text); } catch(error) { this.pending=this.pending.filter(value=>value!==pending);throw error; }
    }
  }
  getCommands() { return {...this.state.commands}; }
}
module.exports={parseRunConfig,defaultRunConfig,RunConfigEditor};
