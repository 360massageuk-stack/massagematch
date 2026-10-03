const toast=document.getElementById("toast");
function showToast(msg){toast.textContent=msg;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),2800)}
document.getElementById("searchForm").addEventListener("submit",e=>{e.preventDefault();showToast("Great — the search interface is ready. Real therapist data comes next.");document.getElementById("find").scrollIntoView({behavior:"smooth"})});
document.getElementById("demoContinue").addEventListener("click",e=>{e.preventDefault();showToast("This is the profile-builder preview. Next we'll connect real therapist accounts.")});
document.querySelector(".menu").addEventListener("click",()=>showToast("Mobile navigation is ready for the next build."));
