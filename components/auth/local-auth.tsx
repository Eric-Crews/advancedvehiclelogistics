'use client';
import React,{createContext,useContext,useEffect,useState} from 'react';
import { useRouter } from 'next/navigation';
const Context=createContext({isSignedIn:false,isLoaded:false,email:''});
export function AuthProvider({children}:{children:React.ReactNode}){const [state,setState]=useState({isSignedIn:false,isLoaded:false,email:''});useEffect(()=>{void fetch('/api/account/me',{cache:'no-store'}).then(r=>r.json() as Promise<{signedIn?:boolean;email?:string}>).then(d=>setState({isSignedIn:Boolean(d.signedIn),isLoaded:true,email:d.email||''})).catch(()=>setState({isSignedIn:false,isLoaded:true,email:''}))},[]);return <Context.Provider value={state}>{children}</Context.Provider>}
export function useAuth(){return useContext(Context)}
export function Show({when,children}:{when:'signed-in'|'signed-out';children:React.ReactNode}){const a=useAuth();return a.isLoaded&&a.isSignedIn===(when==='signed-in')?<>{children}</>:null}
function AuthLink({to,children}:{to:string;children:React.ReactNode}){const router=useRouter();return <span className="auth-link-wrap" onClick={()=>router.push(`${to}?next=${encodeURIComponent(window.location.pathname+window.location.search)}`)}>{children}</span>}
export function SignInButton({children}:{mode?:string;children:React.ReactNode}){return <AuthLink to="/sign-in">{children}</AuthLink>}
export function SignUpButton({children}:{mode?:string;children:React.ReactNode}){return <AuthLink to="/sign-up">{children}</AuthLink>}
export function UserButton(){const a=useAuth();return <div className="local-user"><span title={a.email}>{a.email.split('@')[0]}</span><button type="button" onClick={async()=>{await fetch('/api/account/signout',{method:'POST'});window.location.href='/'}}>Sign out</button></div>}
