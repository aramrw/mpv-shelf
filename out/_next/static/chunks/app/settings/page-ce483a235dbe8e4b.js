(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[938],{4814:function(e,n,t){Promise.resolve().then(t.bind(t,4873))},7904:function(e,n,t){"use strict";t.r(n),t.d(n,{UserAvatar:function(){return f}});var i=t(3827),l=t(4090),a=t(2178),s=t(2169);let o=l.forwardRef((e,n)=>{let{className:t,...l}=e;return(0,i.jsx)(a.fC,{ref:n,className:(0,s.cn)("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",t),...l})});o.displayName=a.fC.displayName;let r=l.forwardRef((e,n)=>{let{className:t,...l}=e;return(0,i.jsx)(a.Ee,{ref:n,className:(0,s.cn)("aspect-square h-full w-full",t),...l})});r.displayName=a.Ee.displayName;let d=l.forwardRef((e,n)=>{let{className:t,...l}=e;return(0,i.jsx)(a.NY,{ref:n,className:(0,s.cn)("flex h-full w-full items-center justify-center rounded-full bg-muted",t),...l})});d.displayName=a.NY.displayName;var u=t(1213),c=t(3854),m=t(7907);function f(e){let{userObject:n,asChild:t}=e,l=(0,m.usePathname)();return console.log("userAvatar"),(0,i.jsxs)(o,{className:(0,s.cn)("h-auto w-40 text-xl font-medium rounded-sm md:w-52 lg:w-64 xl:w-80 flex justify-center items-center outline drop-shadow-lg shadow-md text-background",t&&"h-auto w-full text-lg font-medium outline rounded",t&&(null==n?void 0:n.imagePath)&&"md:w-3/4 rounded-none",t&&(null==n?void 0:n.imagePath)&&"h-40 md:w-40 rounded-sm",t&&!(null==n?void 0:n.imagePath)&&"outline drop-shadow-md",t&&n.imagePath&&"w-full outline-none"),children:[(0,i.jsx)(r,{src:(null==n?void 0:n.imagePath)?null==n?void 0:n.imagePath:"",alt:null==n?void 0:n.id.toString(),className:(0,s.cn)("object-cover drop-shadow-md",t&&"w-5/6 lg:w-[60%]")}),(0,i.jsx)(d,{className:(0,s.cn)("h-40 w-40 text-xl font-medium rounded-sm select-none flex justify-center items-center",t&&"w-full text-lg font-medium",!t&&"md:w-52\n                 md:h-52  \n                 lg:w-64 \n                 lg:h-64\n                 xl:h-80\n                 xl:w-80",l.includes("/login")&&"h-40 w-40"),children:(0,i.jsxs)("div",{className:"flex h-full w-full flex-col items-center justify-center",style:{backgroundColor:"".concat(null==n?void 0:n.color)},children:[(0,i.jsx)("span",{className:(0,s.cn)("flex outline outline-2 text-center  \n                        md:text-2xl \n                        md:pb-0.5\n                        lg:text-4xl\n                        lg:mt-3\n                        xl:pb-1.5\n                        xl:text-5xl \n                        rounded-sm px-2 font-bold text-lg\n                        drop-shadow-md",!(null==n?void 0:n.id)&&"outline-none shadow-none",t&&"text-lg md:text-xl lg:text-2xl xl:text-3xl"),children:null==n?void 0:n.id}),(null==n?void 0:n.id)?(0,i.jsx)(u.Z,{className:"h-auto w-1/2 drop-shadow-md",strokeWidth:1.3}):(0,i.jsx)(c.Z,{className:"h-auto w-1/2 text-tertiary drop-shadow-md",strokeWidth:1.3})]})})]})}},4873:function(e,n,t){"use strict";t.r(n),t.d(n,{default:function(){return T}});var i=t(3827),l=t(575),a=t(4090),s=t(248),o=t(8374),r=t(1774),d=t(8152),u=t(2169);let c=d.zt,m=d.fC,f=d.xz,x=a.forwardRef((e,n)=>{let{className:t,sideOffset:l=4,...a}=e;return(0,i.jsx)(d.VY,{ref:n,sideOffset:l,className:(0,u.cn)("z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",t),...a})});x.displayName=d.VY.displayName;var h=t(4302),g=t(7424),v=t(5566),p=t(3854),w=t(1047),j=t(2891),N=t(2686),b=t(9910),y=t(8814),S=t(3416),z=t(1652),L=t(5693),O=t(9259),P=t(2684),k=t(1348),C=t(1300),M=t(7147),X=t(7067);async function E(){return!!await (0,X.iG)("Are you sure you would like to turn off your pin? \nThis will allow anyone to sign into your profile.",{title:"Turn off PIN?",type:"warning"})}async function I(){return!!await (0,X.iG)("Are you sure you would like to change your pin?",{title:"Change PIN?",type:"warning"})}async function R(){await (0,X.yw)("You entered the same pin. No changes were made.",{title:"Pin is the same.",type:"error"})}async function Z(){return!!await (0,X.iG)("\n    Are you sure you would like to delete your profile? \n    You will lose all data associated with this profile forever.",{title:"Delete Account?",type:"error"})}var A=t(7907),D=t(7904);let Y=s.z.object({theme:s.z.enum(["Light","Dark"]),fontSize:s.z.enum(["Small","Medium","Large","XLarge"]),animations:s.z.enum(["On","Off"]),autoRename:s.z.enum(["On","Off"]),usePin:s.z.enum(["On","Off"])});function T(){let{toast:e}=(0,M.pm)(),{setTheme:n}=(0,r.F)(),[t,s]=(0,a.useState)({theme:"Light",fontSize:"Large",animations:"On",autoRename:"Off",usePin:"On"}),[d,T]=(0,a.useState)(),[U,_]=(0,a.useState)(!0),[F,V]=(0,a.useState)(!1),[G,H]=(0,a.useState)(!0),[W,Q]=(0,a.useState)({}),q=(0,A.useRouter)();(0,a.useEffect)(()=>{(0,o.Rf)().then(e=>{e&&((0,o.QQ)().then(n=>{for(let t of e)if(t.id===(null==n?void 0:n.userId)){T(t);break}}),e.length>1&&V(!0))})},[]),(0,a.useEffect)(()=>{(null==d?void 0:d.id)&&(0,o.nS)({userId:null==d?void 0:d.id}).then(e=>{console.log(e),e&&(s(e),Q(e),H(!0))})},[d]),(0,a.useEffect)(()=>{(null==d?void 0:d.pin)==="disabled"&&"On"===t.usePin&&_(!1)},[d,t.usePin]),(0,a.useEffect)(()=>{H(!1)},[t]);let B=()=>{(0,o.oY)({userId:-1}).then(()=>(0,o.xe)()).finally(()=>{q.push("/")})};return(0,i.jsx)(P.E.main,{className:(0,u.cn)("h-fit pb-2 w-full",(null==t?void 0:t.fontSize)==="Medium"&&"text-lg",(null==t?void 0:t.fontSize)==="Large"&&"text-xl",(null==t?void 0:t.fontSize)==="XLarge"&&"text-2xl"),initial:{opacity:0,y:-100},animate:{opacity:1,y:0},exit:{opacity:0},transition:{duration:.5,bounce:1,type:"spring",damping:10},children:(0,i.jsxs)("form",{className:"h-fit w-full md:px-16 lg:px-32 xl:px-48",onSubmit:e=>{e.preventDefault(),(null==d?void 0:d.pin)==="disabled"&&t.usePin;let n=new FormData(e.currentTarget),i={theme:n.get("theme"),fontSize:n.get("fontSize"),animations:n.get("animations"),autoRename:n.get("autoRename"),usePin:n.get("usePin")},l=n.get("pin"),a=Y.safeParse(i);if(!a.success){console.error("Validation failed",a.error);return}(null==d?void 0:d.id)&&(0,o.VP)({formData:a.data,userId:null==d?void 0:d.id}).then(()=>{(null==d?void 0:d.pin)&&(l&&l!==(null==d?void 0:d.pin.toString())?(0,o.eu)({userId:d.id,newPin:l.toString()}):"Off"===t.usePin&&(0,o.eu)({userId:d.id,newPin:"disabled"}))})},children:[(0,i.jsxs)("ul",{className:"flex h-full w-full flex-col gap-2 p-2",children:[(0,i.jsxs)("li",{className:"flex h-fit flex-col justify-center rounded-b-sm bg-muted",children:[(0,i.jsx)("h1",{className:"select-none rounded-t-sm bg-accent px-1 font-bold",children:"User"}),(0,i.jsxs)("ul",{className:"flex flex-col gap-3 p-2",children:[F&&(0,i.jsx)("li",{className:"fit flex max-h-96 w-full items-center justify-between gap-2 bg-muted",children:(0,i.jsx)("div",{className:"flex h-fit w-full flex-row items-center justify-between gap-4 rounded-sm bg-monotone p-5",children:d&&(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(P.E.div,{className:"flex w-[50%] cursor-pointer items-center justify-center rounded-sm",style:{background:"url(".concat(null==d?void 0:d.imagePath,")"),backgroundSize:"cover"},children:(0,i.jsx)(D.UserAvatar,{userObject:d,asChild:!0})}),(0,i.jsxs)("div",{className:"flex h-fit w-full flex-col items-center justify-between gap-4 rounded-sm bg-monotone",children:[(0,i.jsx)(c,{children:(0,i.jsxs)(m,{delayDuration:1e3,children:[(0,i.jsx)(f,{asChild:!0,className:"flex w-full cursor-pointer flex-row items-center justify-center text-base",children:(0,i.jsxs)(l.z,{variant:"outline",className:(0,u.cn)("select-none h-full w-3/4 p-0 flex gap-1 pb-1",(null==t?void 0:t.fontSize)==="Medium"&&"text-lg",(null==t?void 0:t.fontSize)==="Large"&&"text-xl",(null==t?void 0:t.fontSize)==="XLarge"&&"text-2xl"),onClick:()=>{B()},children:["Sign Out",(0,i.jsx)(h.Z,{className:(0,u.cn)("h-auto w-4 cursor-pointer",(null==t?void 0:t.fontSize)==="Medium"&&"h-auto w-5",(null==t?void 0:t.fontSize)==="Large"&&"h-auto w-6",(null==t?void 0:t.fontSize)==="XLarge"&&"h-auto w-7")})]})}),(0,i.jsx)(x,{className:(0,u.cn)("select-none flex gap-1",(null==t?void 0:t.fontSize)==="Medium"&&"text-lg",(null==t?void 0:t.fontSize)==="Large"&&"text-xl",(null==t?void 0:t.fontSize)==="XLarge"&&"text-2xl"),children:(0,i.jsx)("div",{className:"text-center font-medium",children:(0,i.jsxs)("span",{className:"text-center",children:["Takes you back to the ",(0,i.jsx)("b",{children:"profile selection screen"}),".",(0,i.jsx)("br",{}),"You are currently signed in as  ",(0,i.jsxs)("b",{children:["User ",null==d?void 0:d.id]}),"."]})})})]})}),(0,i.jsx)(c,{children:(0,i.jsxs)(m,{delayDuration:1e3,children:[(0,i.jsx)(f,{asChild:!0,className:"flex w-full cursor-pointer flex-row items-center justify-center text-base",children:(0,i.jsxs)(l.z,{variant:"outline",className:(0,u.cn)("select-none  h-full w-3/4 p-0 flex gap-1 pb-1",(null==t?void 0:t.fontSize)==="Medium"&&"text-lg",(null==t?void 0:t.fontSize)==="Large"&&"text-xl",(null==t?void 0:t.fontSize)==="XLarge"&&"text-2xl"),onClick:()=>{(0,X.bA)({directory:!1,multiple:!1,filters:[{name:"Image",extensions:["png","jpeg","jpg","gif"]}],title:"Select Profile Picture"}).then(e=>{e&&d&&(0,o.Nk)({userId:null==d?void 0:d.id,imagePath:null==e?void 0:e.toString()}).then(()=>{d&&window.location.reload()})})},children:["Change Avatar",(0,i.jsx)(g.Z,{className:(0,u.cn)("h-auto w-4 cursor-pointer",(null==t?void 0:t.fontSize)==="Medium"&&"h-auto w-5",(null==t?void 0:t.fontSize)==="Large"&&"h-auto w-6",(null==t?void 0:t.fontSize)==="XLarge"&&"h-auto w-7")})]})}),(0,i.jsx)(x,{side:"bottom",className:(0,u.cn)("select-none flex gap-1",(null==t?void 0:t.fontSize)==="Medium"&&"text-lg",(null==t?void 0:t.fontSize)==="Large"&&"text-xl",(null==t?void 0:t.fontSize)==="XLarge"&&"text-2xl"),children:(0,i.jsx)("div",{className:"text-center font-medium",children:(0,i.jsxs)("span",{className:"",children:["Click to change your ",(0,i.jsx)("b",{children:"profile picture"}),"."]})})})]})}),F&&(0,i.jsx)(c,{children:(0,i.jsxs)(m,{delayDuration:700,children:[(0,i.jsx)(f,{asChild:!0,className:"flex w-full cursor-pointer flex-row items-center justify-center text-base",children:(0,i.jsxs)(l.z,{variant:"destructive",className:(0,u.cn)("select-none w-3/4 py-[1px] h-fit  flex flex-row justify-center items-center rounded-sm gap-1 pb-1",(null==t?void 0:t.fontSize)==="Medium"&&"text-lg",(null==t?void 0:t.fontSize)==="Large"&&"text-xl",(null==t?void 0:t.fontSize)==="XLarge"&&"text-2xl"),onClick:()=>{Z().then(e=>{e&&(null==d?void 0:d.id)&&(0,o.he)({userId:d.id}).then(()=>{(0,o.oY)({userId:-1}).then(()=>(0,o.xe)()).finally(()=>{q.push("/")})})})},children:["Delete Profile",(0,i.jsx)(v.Z,{className:(0,u.cn)("h-auto w-4 cursor-pointer",(null==t?void 0:t.fontSize)==="Medium"&&"h-auto w-5",(null==t?void 0:t.fontSize)==="Large"&&"h-auto w-6",(null==t?void 0:t.fontSize)==="XLarge"&&"h-auto w-7")})]})}),(0,i.jsx)(x,{align:"center",side:"bottom",className:(0,u.cn)("select-none flex gap-1",(null==t?void 0:t.fontSize)==="Medium"&&"text-md",(null==t?void 0:t.fontSize)==="Large"&&"text-lg",(null==t?void 0:t.fontSize)==="XLarge"&&"text-xl"),children:(0,i.jsx)("div",{className:"font-medium",children:(0,i.jsxs)("div",{className:"flex flex-col items-center justify-center gap-1",children:[(0,i.jsxs)("div",{className:"flex flex-row gap-0.5",children:[(0,i.jsx)("span",{className:"rounded-sm font-bold",children:" Deletes your profile and"}),(0,i.jsx)("b",{className:"text-destructive underline",children:"all associated data."})]}),(0,i.jsx)("b",{className:"rounded-sm bg-accent px-1",children:" This action is irreversible."})]})})})]})})]})]})})}),!F&&(0,i.jsx)("li",{className:"flex h-fit w-full items-center justify-center bg-muted",children:(0,i.jsxs)(l.z,{variant:"outline",className:(0,u.cn)("select-none w-1/2 py-1 h-1/4 flex flex-row justify-center items-center gap-1",(null==t?void 0:t.fontSize)==="Medium"&&"text-lg",(null==t?void 0:t.fontSize)==="Large"&&"text-xl",(null==t?void 0:t.fontSize)==="XLarge"&&"text-2xl"),onClick:()=>{(0,o.xe)().then(()=>{q.push("/profiles/newUser")})},children:["Add New Profile",(0,i.jsx)(p.Z,{className:(0,u.cn)("h-auto w-4 cursor-pointer",(null==t?void 0:t.fontSize)==="Medium"&&"h-auto w-5",(null==t?void 0:t.fontSize)==="Large"&&"h-auto w-6",(null==t?void 0:t.fontSize)==="XLarge"&&"h-auto w-7")})]})})]})]}),(0,i.jsxs)("li",{className:"flex h-fit flex-col justify-center rounded-b-sm bg-muted",children:[(0,i.jsx)("h1",{className:"select-none rounded-t-sm bg-accent px-1 font-bold",children:"UI / UX"}),(0,i.jsxs)("ul",{className:"flex flex-col gap-3 p-2",children:[(0,i.jsxs)("li",{className:"flex h-fit w-full bg-muted",children:[(0,i.jsxs)("div",{className:"flex w-1/2 items-center justify-start gap-1",children:[(0,i.jsx)("h1",{className:"select-none font-medium",children:"Theme"}),(0,i.jsx)(k.M,{mode:"wait",children:"Light"===t.theme?(0,i.jsx)(P.E.div,{animate:"On"===t.animations?{scale:1.05}:void 0,initial:"On"===t.animations?{scale:.95}:void 0,exit:"On"===t.animations?{scale:.95}:void 0,transition:"On"===t.animations?{duration:.5}:void 0,children:(0,i.jsx)(w.Z,{className:(0,u.cn)("h-auto w-4 cursor-pointer",(null==t?void 0:t.fontSize)==="Medium"&&"h-auto w-5",(null==t?void 0:t.fontSize)==="Large"&&"h-auto w-6",(null==t?void 0:t.fontSize)==="XLarge"&&"h-auto w-7")})},"light"):(0,i.jsx)(P.E.div,{animate:"On"===t.animations?{scale:1.05}:void 0,initial:"On"===t.animations?{scale:.95}:void 0,exit:"On"===t.animations?{scale:.95}:void 0,transition:"On"===t.animations?{duration:.5}:void 0,children:(0,i.jsx)(j.Z,{className:(0,u.cn)("h-auto w-4 cursor-pointer",(null==t?void 0:t.fontSize)==="Medium"&&"h-auto w-5",(null==t?void 0:t.fontSize)==="Large"&&"h-auto w-6",(null==t?void 0:t.fontSize)==="XLarge"&&"h-auto w-7")})})})]}),(0,i.jsxs)("select",{className:"w-1/2 cursor-pointer rounded-sm bg-accent font-medium",name:"theme",value:t.theme,onChange:e=>{s({...t,theme:e.target.value}),n(e.target.value.toLowerCase())},onLoad:e=>{n(t.theme)},children:[(0,i.jsx)("option",{className:"font-medium",children:"Light"}),(0,i.jsx)("option",{className:"font-medium",children:"Dark"})]})]}),(0,i.jsxs)("li",{className:"flex h-fit w-full bg-muted",children:[(0,i.jsxs)("div",{className:"flex w-1/2 items-center justify-start gap-1",children:[(0,i.jsx)("h1",{className:"select-none font-medium",children:"Font Size"}),(0,i.jsx)(N.Z,{className:(0,u.cn)("h-auto w-4 cursor-pointer",(null==t?void 0:t.fontSize)==="Medium"&&"h-auto w-5",(null==t?void 0:t.fontSize)==="Large"&&"h-auto w-6",(null==t?void 0:t.fontSize)==="XLarge"&&"h-auto w-7")})]}),(0,i.jsxs)("select",{className:"w-1/2 cursor-pointer rounded-sm bg-accent font-medium",name:"fontSize",value:t.fontSize,onChange:e=>{s({...t,fontSize:e.target.value})},children:[(0,i.jsx)("option",{className:"font-medium",children:"Small"}),(0,i.jsx)("option",{className:"font-medium",children:"Medium"}),(0,i.jsx)("option",{className:"font-medium",children:"Large"}),(0,i.jsx)("option",{className:"font-medium",children:"XLarge"})]})]}),(0,i.jsxs)("li",{className:"flex h-fit w-full bg-muted",children:[(0,i.jsxs)("div",{className:"flex w-1/2 items-center justify-start gap-1",children:[(0,i.jsx)("h1",{className:"select-none font-medium",children:"Animations"}),(0,i.jsx)(P.E.div,{whileHover:"On"===t.animations?{scale:1.2}:void 0,whileTap:"On"===t.animations?{scale:.8}:void 0,transition:t.animations?{type:"spring",stiffness:800,damping:17}:void 0,drag:!0,dragConstraints:t.animations?{left:0,right:0,top:0,bottom:0}:void 0,children:(0,i.jsx)(b.Z,{className:(0,u.cn)("h-auto w-4 cursor-pointer",(null==t?void 0:t.fontSize)==="Medium"&&"h-auto w-5",(null==t?void 0:t.fontSize)==="Large"&&"h-auto w-6",(null==t?void 0:t.fontSize)==="XLarge"&&"h-auto w-7")})})]}),(0,i.jsxs)("select",{className:"w-1/2 cursor-pointer rounded-sm bg-accent font-medium",name:"animations",value:t.animations,onChange:e=>{s({...t,animations:e.target.value})},children:[(0,i.jsx)("option",{className:"font-medium",children:"On"}),(0,i.jsx)("option",{className:"font-medium",children:"Off"})]})]})]})]}),(0,i.jsxs)("li",{className:"flex h-fit flex-col justify-center rounded-b-sm bg-muted",children:[(0,i.jsx)("h1",{className:"select-none rounded-t-sm bg-accent px-1 font-bold",children:"Application"}),(0,i.jsx)("ul",{className:"flex flex-col gap-3 p-2",children:(0,i.jsxs)("li",{className:"flex h-fit w-full justify-between bg-muted",children:[(0,i.jsx)(c,{children:(0,i.jsxs)(m,{delayDuration:400,children:[(0,i.jsx)("div",{className:"flex w-full flex-row gap-1",children:(0,i.jsxs)(f,{className:"flex w-full flex-row items-center justify-start gap-1",children:[(0,i.jsx)(y.Z,{className:(0,u.cn)("h-auto w-4 cursor-pointer",(null==t?void 0:t.fontSize)==="Medium"&&"h-auto w-5",(null==t?void 0:t.fontSize)==="Large"&&"h-auto w-6",(null==t?void 0:t.fontSize)==="XLarge"&&"h-auto w-7")}),(0,i.jsx)("h1",{className:"select-none font-medium",children:"Auto Rename"})]})}),(0,i.jsx)(x,{align:"start",side:"bottom",className:(0,u.cn)("select-none flex text-center",(null==t?void 0:t.fontSize)==="Medium"&&"text-md",(null==t?void 0:t.fontSize)==="Large"&&"text-lg",(null==t?void 0:t.fontSize)==="XLarge"&&"text-xl"),children:(0,i.jsxs)("div",{className:"font-medium",children:[(0,i.jsx)("span",{className:"font-bold",children:"Renames subtitle files to match video."}),(0,i.jsx)("br",{}),(0,i.jsx)("span",{className:(0,u.cn)("font-bold",(null==t?void 0:t.fontSize)==="Medium"&&"text-md",(null==t?void 0:t.fontSize)==="Large"&&"text-lg",(null==t?void 0:t.fontSize)==="XLarge"&&"text-xl"),children:"Note:"})," Subtitle files must be in the ",(0,i.jsx)("b",{children:"same directory"})," as the video file,",(0,i.jsx)("br",{}),"as mpv auto loads subtitles if the names are the same."]})})]})}),(0,i.jsxs)("select",{className:"w-full cursor-pointer rounded-sm bg-accent font-medium",name:"autoRename",value:t.autoRename,onChange:e=>{s({...t,autoRename:e.target.value})},children:[(0,i.jsx)("option",{className:"font-medium",children:"On"}),(0,i.jsx)("option",{className:"font-medium",children:"Off"})]})]})})]}),(0,i.jsxs)("li",{className:"flex h-fit flex-col justify-center rounded-b-sm bg-muted",children:[(0,i.jsx)("h1",{className:"select-none rounded-t-sm bg-accent px-1 font-bold",children:"Security"}),(0,i.jsxs)("ul",{className:"flex flex-col gap-3 p-2",children:[(0,i.jsxs)("li",{className:"flex h-fit w-full justify-between bg-muted",children:[(0,i.jsx)("h1",{className:"w-1/2 select-none font-medium",children:"Use Pin"}),(0,i.jsxs)("select",{className:"w-1/2 cursor-pointer rounded-sm bg-accent font-medium",name:"usePin",value:t.usePin,onChange:e=>{"Off"===e.target.value?E().then(e=>{e&&(s({...t,usePin:"Off"}),H(!0),Q(t))}):"On"===e.target.value&&s({...t,usePin:"On"})},children:[(0,i.jsx)("option",{className:"font-medium",children:"On"}),(0,i.jsx)("option",{className:"font-medium",children:"Off"})]})]}),"On"===t.usePin&&(null==d?void 0:d.pin)&&(0,i.jsxs)("li",{className:"flex h-fit w-full bg-muted",children:[(0,i.jsx)("h1",{className:"w-1/2 select-none font-medium",children:"Pin"}),(0,i.jsxs)("div",{className:(0,u.cn)("flex w-1/2 flex-row"),children:[!U&&(0,i.jsx)(P.E.div,{className:(0,u.cn)("flex h-full cursor-pointer flex-row items-center justify-center rounded-l-sm bg-accent px-1"),whileHover:{scale:1.05},whileTap:{scale:.95},onClick:()=>{(null==d?void 0:d.pin)&&((0,C.n)(d.pin.toString()),e({className:"cursor-pointer",title:"Pin Copied!",description:"Click to see pin.",duration:1500,onClick:()=>{(null==d?void 0:d.pin)&&e({className:"cursor-pointer",variant:"destructive",style:{backdropFilter:"blur(5px)",fontWeight:"bold"},description:"UserID: ".concat(d.id,"・Pin: ").concat(d.pin),duration:1500})}}))},children:(0,i.jsx)(S.Z,{className:(0,u.cn)("h-5/6 w-4",(null==t?void 0:t.fontSize)==="Medium"&&"h-auto w-5",(null==t?void 0:t.fontSize)==="Large"&&"h-auto w-6",(null==t?void 0:t.fontSize)==="XLarge"&&"h-auto w-7")})}),(0,i.jsx)("input",{className:(0,u.cn)("w-full rounded-l-sm bg-accent px-1 font-medium",U&&"cursor-not-allowed select-none opacity-50 focus:outline-none",!U&&"rounded-none","disabled"===d.pin&&"On"===t.usePin&&"animate-pulse text-white"),type:"password",name:"pin",maxLength:4,pattern:"[0-9]{4}",title:"Numbers Only",placeholder:"disabled"===d.pin&&"On"===t.usePin?"Enter a pin #":"••••",readOnly:U,onChange:n=>{4===n.target.value.length&&d.pin&&((null==d?void 0:d.id)&&n.target.value===d.pin.toString()?R().then(()=>{_(!0)}):I().then(i=>{i&&(_(!0),(null==d?void 0:d.pin)&&(null==d?void 0:d.id)&&n.target.value!==d.pin.toString()&&((0,o.eu)({userId:d.id,newPin:n.target.value}).then(()=>{T({...d,pin:n.target.value}),e({title:"Pin Changed!",description:"Your pin has been updated.",duration:1500})}),(0,o.wZ)({userId:d.id}),H(!0),Q(t)))}))}}),(0,i.jsx)(P.E.div,{className:"flex h-full cursor-pointer flex-row items-center justify-center rounded-r-sm bg-accent px-1",whileHover:{scale:1.05},whileTap:{scale:.95},onClick:()=>{_(!U)},children:U?(0,i.jsx)(z.Z,{className:(0,u.cn)("h-5/6 w-4",(null==t?void 0:t.fontSize)==="Medium"&&"h-auto w-5",(null==t?void 0:t.fontSize)==="Large"&&"h-auto w-6",(null==t?void 0:t.fontSize)==="XLarge"&&"h-auto w-7")}):(0,i.jsx)(L.Z,{className:(0,u.cn)("h-5/6 w-4 cursor-pointer ",(null==t?void 0:t.fontSize)==="Medium"&&"h-auto w-5",(null==t?void 0:t.fontSize)==="Large"&&"h-auto w-6",(null==t?void 0:t.fontSize)==="XLarge"&&"h-auto w-7")})})]})]})]})]})]}),(0,i.jsx)(k.M,{mode:"wait",children:(0,i.jsx)(k.M,{mode:"wait",children:G?(0,i.jsx)(P.E.div,{className:"flex w-full flex-row items-center gap-2 text-base",initial:"On"===t.animations?{opacity:0}:void 0,animate:"On"===t.animations?{opacity:1}:void 0,exit:"On"===t.animations?{opacity:0}:void 0,transition:"On"===t.animations?{duration:.5}:void 0,children:(0,i.jsxs)(l.z,{variant:"outline",className:(0,u.cn)("mx-2 select-none transition-all flex flex-row justify-center items-center gap-1 text-base ",(null==t?void 0:t.fontSize)==="Medium"&&"text-lg",(null==t?void 0:t.fontSize)==="Large"&&"text-xl",(null==t?void 0:t.fontSize)==="XLarge"&&"text-2xl"),type:"submit",children:[(0,i.jsx)(O.Z,{className:(0,u.cn)("h-5/6 w-4",(null==t?void 0:t.fontSize)==="Medium"&&"h-auto w-5",(null==t?void 0:t.fontSize)==="Large"&&"h-auto w-6",(null==t?void 0:t.fontSize)==="XLarge"&&"h-auto w-7")}),"Saved Changes"]})},"saved"):(0,i.jsx)(P.E.div,{className:"flex w-full flex-row items-center gap-2 text-base",initial:"On"===t.animations?{opacity:0}:void 0,animate:"On"===t.animations?{opacity:1}:void 0,exit:"On"===t.animations?{opacity:0}:void 0,transition:"On"===t.animations?{duration:.5}:void 0,children:(0,i.jsx)(l.z,{variant:"outline",className:(0,u.cn)("mx-2 select-none transition-all text-base",(null==t?void 0:t.fontSize)==="Medium"&&"text-lg",(null==t?void 0:t.fontSize)==="Large"&&"text-xl",(null==t?void 0:t.fontSize)==="XLarge"&&"text-2xl",t!==W&&"animate-pulse duration-400"),type:"submit",onClick:()=>{H(!0),Q(t)},children:"Save"})},"save")})})]})})}},575:function(e,n,t){"use strict";t.d(n,{z:function(){return d}});var i=t(3827),l=t(4090),a=t(9143),s=t(7742),o=t(2169);let r=(0,s.j)("inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",{variants:{variant:{default:"bg-primary text-primary-foreground hover:bg-primary/90",destructive:"bg-destructive text-destructive-foreground hover:bg-destructive/90",outline:"border border-input bg-background hover:bg-accent hover:text-accent-foreground",secondary:"bg-secondary text-secondary-foreground hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-10 px-4 py-2",sm:"h-9 rounded-md px-3",lg:"h-11 rounded-md px-8",icon:"h-10 w-10"}},defaultVariants:{variant:"default",size:"default"}}),d=l.forwardRef((e,n)=>{let{className:t,variant:l,size:s,asChild:d=!1,...u}=e,c=d?a.g7:"button";return(0,i.jsx)(c,{className:(0,o.cn)(r({variant:l,size:s,className:t})),ref:n,...u})});d.displayName="Button"}},function(e){e.O(0,[247,851,64,98,648,645,971,69,744],function(){return e(e.s=4814)}),_N_E=e.O()}]);