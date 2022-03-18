import {createItem,initialPrompt} from "./listener.js";
import * as sale from "./saleHandling.js"

import 'regenerator-runtime/runtime'
import { initContract, login, logout } from './utils'

function createHeader(){
	const header=document.createElement("div");
	header.id='header';

	let state=window.walletConnection.isSignedIn();
	
	header.innerHTML=`	<div id='name'>Ignitus Networks</div>
						<button id="login_button">${state ? 'Log Out' : 'Log In'}</button>`

	let button=header.querySelector('#login_button');

	button.addEventListener('click',()=>{
		if (state){
			logout();
		}
		else{
			login();
		}
	})

	return header;
}

function welcome(){
	const container=document.createElement("div");
	container.id="introduction";

	container.innerHTML=	`<div id='welcome_container'>
								<div id='welcome'>Welcome to our marketplace to buy, sell and discover NFTs!</div>
								<div id='subtext'>It is one of the largest NFT marketplaces around!</div>
							</div>`

	const item=createItem("imgs/image_0.jpg","An Example NFT","2 units",280,false);

	container.appendChild(item);

	return container;
}

function createBody(){
	const container=document.createElement("div");
	container.id="body_container";

	let state=window.walletConnection.isSignedIn();

	if(!state){
		let warning_message=document.createElement("div");
		warning_message.id='provoke_login'
		warning_message.textContent='Please Log In with your NEAR Wallet To Buy the Nfts on Sale!'
		container.appendChild(warning_message);
	}

	container.innerHTML+=`<div id="body_title">Items At Sale From Our Nft Contract!</div>
						<div id="main_sale_container"></div>`
	return container;
}

function footer(){
	const footer=document.createElement("div");
	footer.id='footer';
	footer.innerHTML=`<div id="footer_content">Made by Ignitus Networks, powered by NEAR</div>`;
	return footer;
}

function initialSite(){

	const content=document.getElementById("content")
	content.appendChild(createHeader());
	content.appendChild(welcome());
	content.appendChild(createBody());
	content.appendChild(footer());
}

window.nearInitPromise = initContract().then(initialSite).then(sale.populateSales);

setInterval(sale.populateSales, 2000);
