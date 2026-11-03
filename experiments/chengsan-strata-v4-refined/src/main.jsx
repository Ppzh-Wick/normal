import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './expressive.css';
class ExhibitionBoundary extends React.Component{
 constructor(props){super(props);this.state={failed:false};}
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<main style={{padding:'12vh 8%',fontFamily:'serif'}}><h1>李承三 · 山河之间</h1><p style={{margin:'24px 0',lineHeight:2}}>展览暂时未能打开。李承三（1899—1967），号继五，河北涉县人，长期从事地质、地理调查与教学。</p><button onClick={()=>location.reload()} style={{border:'1px solid',padding:'12px 24px'}}>重新打开展览</button></main>:this.props.children;}
}
createRoot(document.getElementById('root')).render(<ExhibitionBoundary><App/></ExhibitionBoundary>);
