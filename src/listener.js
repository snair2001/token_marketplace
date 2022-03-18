const item=(img_src,author,bid,height,remaining)=>{
	return {img_src,author,bid,height,remaining};
}

function initialPrompt(e){
	console.log("lol");
}

function createItem(img_src,author,bid,height, buy_button_view=true){

	const container=document.createElement("div");
	container.classList.add('item_container');

	container.innerHTML=`<img src=${img_src} height=${height} class='item_image'>
						<div class='item_info'>
							<div class='item_left'>
								<div class='item_owner'>${author}</div>
								<div class='item_bid'>Cost: ${bid}</div>
							</div>
						</div>`
 
	let info=container.querySelector('.item-info');
	if(buy_button_view){
		const buy_button=document.createElement("button");
		buy_button.textContent="Buy";
		buy_button.classList.add('buy_button');
		buy_button.addEventListener("click",initialPrompt);
		info.appendChild(buy_button);
	}
	

	return container;
}


export {createItem,initialPrompt};