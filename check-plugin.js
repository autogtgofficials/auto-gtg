import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';
console.log(Object.keys(firebaseRulesPlugin));
if (firebaseRulesPlugin.configs) console.log('configs:', Object.keys(firebaseRulesPlugin.configs));
