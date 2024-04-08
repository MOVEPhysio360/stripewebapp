import 'bootstrap/dist/css/bootstrap.min.css';
import { Form, InputGroup, Row, Button } from 'react-bootstrap';
import React from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import CurrencyInput from 'react-currency-input-field';
import './style.css';
import { createClient } from '@supabase/supabase-js'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

const supabase = createClient('https://klzbntgbyuiayhpmpnki.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsemJudGdieXVpYXlocG1wbmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI1MTgwNDUsImV4cCI6MjAyODA5NDA0NX0.ogpjp-B9gB-f2KkGqqd8M6jvcau4vesQtNppxwpmXos');

// // Needed For Stripe
var TerminalIDGlobal = "";
var APIKeyGlobal = "";

// // URL Encode Function
function URLEncodeRequest(data)
{
    var formBodyEncoded = [];
    for(var prop in data)
    {
    var encodedKey = encodeURIComponent(prop);
    var encodedValue = encodeURIComponent(data[prop])
    formBodyEncoded.push(encodedKey+"="+encodedValue);
    }
    formBodyEncoded = formBodyEncoded.join("&");
    return(formBodyEncoded);
}

// // Create Payment and Hand off to Reader
function CreatePaymentIntent(value, descriptionInput, CustomerEmail)
{
  let rawValue = value * 100;
  rawValue = rawValue.toFixed(0);
   // ADD Percentage
    const data = {
        amount: rawValue,
        description: descriptionInput,
        currency: 'gbp',
        "payment_method_types[]": ['card_present']
    }
    if(CustomerEmail != "")
    {
      data["receipt_email"] = CustomerEmail;
    }
   let formBodyEncoded = URLEncodeRequest(data);
   fetch("https://api.stripe.com/v1/payment_intents", {
    method: 'POST',
    headers: { 
      "Content-Type":"application/json",
      "Authorization": "Bearer " + APIKeyGlobal,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    },
    body: formBodyEncoded
   }).then((response) => response.json()).then((data) => {
    console.log("Success:",data);
    if(data.error)
    {
      alert(data.error.message)
    }
    else
    {
      alert("Payment Created Successfully!")
    }
    //alert(data.id)
    // Create Data
    const dataForHandingOffIntent = {
      payment_intent: data.id
  }
 let PaymentIDEncoded = URLEncodeRequest(dataForHandingOffIntent);
    // Hand Off Payment Intent to a reader
    
    let HandOffURL = "https://api.stripe.com/v1/terminal/readers/"+ TerminalIDGlobal +"/process_payment_intent"; 
    fetch(HandOffURL, {
      method: 'POST',
      headers: {
        "Content-Type":"application/json",
        "Authorization": "Bearer " + APIKeyGlobal,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: PaymentIDEncoded
    }).then((res) => {res.json()}).then((readerData) => {
      //Alert.alert(readerData);
      console.log("Payment Handed Off Successfully", readerData)
    }).catch((er) => {
      alert(er.error.message)
      console.error("Error From Reader", er); 
    })

   }).catch((error) => {
    console.error("Error:", error);
   })
}


// // Clear Reader
function ClearReaderScreen()
{
  var requestURL = "https://api.stripe.com/v1/terminal/readers/"+ TerminalIDGlobal +"/cancel_action";
  fetch(requestURL, {
    method: 'POST',
    headers: {
      "Content-Type":"application/json",
      "Authorization": "Bearer " + APIKeyGlobal,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    },
  }).then((res) => {res.json()}).then((readerData) => {
    console.log("Payment Handed Off Successfully", readerData)
  }).catch((er) => {
    console.error("Error From Reader", er); 
  })
}
// CHECK IF TERMINAL ID COOKIE PRESENT
function checkTerminalID(){
  if(document.cookie.split(";").some((item) => item.trim().startsWith("Terminal_ID=")))
  {
    const cookieValue = document.cookie
    .split("; ")
    .find((row) => row.startsWith("Terminal_ID="))
    ?.split("=")[1];
    //alert(cookieValue);
    if(cookieValue != null)
    {
      console.log("Global Terminal ID Set to: " + cookieValue);    
      TerminalIDGlobal = cookieValue;

    }
    
  }
}

function checkAPIKey(){
  if(document.cookie.split(";").some((item) => item.trim().startsWith("API_KEY=")))
  {
    const cookieValue = document.cookie
    .split("; ")
    .find((row) => row.startsWith("API_KEY="))
    ?.split("=")[1];
    //alert(cookieValue);
    if(cookieValue != null)
    {
      console.log("Global API Key Set to: " + cookieValue);    
      APIKeyGlobal = cookieValue;

    }
    
  }
}
function logout(){
  supabase.auth.signOut();
}


function App() {
  // Supabase Session
  const [session, setSession] = useState(null);
  const [APIKeyInput, setAPIKeyInput] = React.useState("");
  const [TerminalIDInput, setTerminalIDInput] = React.useState("");
  const [amount, setAmount] = React.useState(0);
  const [Description, setDescription] = React.useState("");
  const [Email, setEmail] = React.useState("");
  checkTerminalID();
  checkAPIKey();
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if(TerminalIDGlobal != null)
      {
        setTerminalIDInput(TerminalIDGlobal);
        console.log("set Terminal ID Global");
      }
      if(APIKeyGlobal != null)
      {
        setAPIKeyInput(APIKeyGlobal);
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])
  //
    if(!session) {
      return (<div style={{display: 'flex' ,alignItems: 'center', justifyContent:'center', height: '100vh'}}><Auth supabaseClient={supabase} providers={Email} appearance={{ theme: ThemeSupa }} /></div>)
    }
    else {
      return (
      <>
    
    <div className='wrapper'>
    <img style={{
            resizeMode: 'cover',
            height: 150,
            width: 150,
          }} src={require('./M_ICON_WHT_GREEN_blk-bg.png')} />
    <div className='title'>
    MOVE Physiotherapy
    </div>
   
    <div >
      Amount £
    </div>
    <div className='amount'>
      <CurrencyInput 
      prefix="£" 
      value={amount}
      decimalsLimit={2}
      onValueChange={(value, name) => setAmount(value)}
       />
    </div>
    <div>
      Customer Email
    </div>
    <div>
      <input
      placeholder='example@gmail.com'
      type='email'
      value={Email}
      onChange={(EmailInputChageEvent) => setEmail(EmailInputChageEvent.target.value)}
      >
      </input>
    </div>
    <div className='Description'>
      Description
    </div>
    <div>
      <input
      placeholder='description for payment'
      value={Description}
      onChange={(DescriptionInputChangeEvent) => setDescription(DescriptionInputChangeEvent.target.value)}
      ></input>
    </div>
    <div className='takePayment'>
       <button 
       className='takePaymentButton'
       onClick={() => {CreatePaymentIntent(amount, Description, Email)}}
       >
        Take Payment
      </button>
    </div>
    <div>
       <button 
       className='ClearReaderButton'
       onClick={() => {ClearReaderScreen()}}
       >
      Clear Reader
      </button>
    </div>
    <div>
       <button 
       className='ClearReaderButton'
       onClick={() => {logout()}}
       >
      Logout
      </button>
    </div>
   
   <div className='settings'>
     <div>
      Settings
    </div>
   <div>
        Terminal ID
    </div>
    <div>
       <input
       value={TerminalIDInput}
       placeholder='Stripe Terminal ID'
       onChange={(inputText) => {
        setTerminalIDInput(inputText.target.value);
        document.cookie = "Terminal_ID=" + inputText.target.value;
       }}
       >
        </input>
    </div>
        <div>
        API Key
       </div>
       <div>
        <input
        value={APIKeyInput}
        placeholder='Stripe API Key'
        onChange={(changeEvent) => {
          setAPIKeyInput(changeEvent.target.value);
          document.cookie = "API_KEY=" + changeEvent.target.value;
        }}
        >
        </input>
       </div> 
    </div>
       </div>
      
    </>
      )
    }
  }
  // return (
  //   <>
    
  //   <div className='wrapper'>
  //   <img style={{
  //           resizeMode: 'cover',
  //           height: 150,
  //           width: 150,
  //         }} src={require('./ideal-showers-final-logo-for-white-v2-trans.png')} />
  //   <div className='title'>
  //   IDEAL Shower Doors
  //   </div>
   
  //   <div >
  //     Amount $
  //   </div>
  //   <div className='amount'>
  //     <CurrencyInput 
  //     prefix="$" 
  //     value={amount}
  //     decimalsLimit={2}
  //     onValueChange={(value, name) => setAmount(value)}
  //      />
  //   </div>
  //   <div>
  //     Customer Email
  //   </div>
  //   <div>
  //     <input
  //     placeholder='example@gmail.com'
  //     type='email'
  //     value={Email}
  //     onChange={(EmailInputChageEvent) => setEmail(EmailInputChageEvent.target.value)}
  //     >
  //     </input>
  //   </div>
  //   <div className='Description'>
  //     Description
  //   </div>
  //   <div>
  //     <input
  //     placeholder='description for payment'
  //     value={Description}
  //     onChange={(DescriptionInputChangeEvent) => setDescription(DescriptionInputChangeEvent.target.value)}
  //     ></input>
  //   </div>
  //   <div className='takePayment'>
  //      <button 
  //      className='takePaymentButton'
  //      onClick={() => {CreatePaymentIntent(amount, Description, Email)}}
  //      >
  //       Take Payment
  //     </button>
  //   </div>
  //   <div>
  //      <button 
  //      className='ClearReaderButton'
  //      onClick={() => {ClearReaderScreen()}}
  //      >
  //     Clear Reader
  //     </button>
  //   </div>
   
  //  <div className='settings'>
  //   <div>
  //     Settings
  //   </div>
  //   <div>
  //       Terminal ID
  //   </div>
  //   <div>
  //      <input
  //      value={TerminalIDInput}
  //      placeholder='Stripe Terminal ID'
  //      onChange={(inputText) => {
  //       setTerminalIDInput(inputText.target.value);
  //       document.cookie = "Terminal_ID=" + inputText.target.value;
  //      }}
  //      >
  //       </input>
  //   </div>
  //      <div>
  //       API Key
  //      </div>
  //      <div>
  //       <input
  //       value={APIKeyInput}
  //       placeholder='Stripe API Key'
  //       onChange={(changeEvent) => {
  //         setAPIKeyInput(changeEvent.target.value);
  //         document.cookie = "API_KEY=" + changeEvent.target.value;
  //       }}
  //       >
  //       </input>
  //      </div>
  //   </div>
  //      </div>
      
  //   </>
    
  // );


export default App;
