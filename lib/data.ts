export type TravelLevel = "WHITE" | "GREEN" | "YELLOW" | "AMBER" | "RED" | "BLACK";
export const levelMeta: Record<TravelLevel,{title:string;bg:string;color:string;description:string}> = {
 WHITE:{title:"Unknown",bg:"#FFFFFF",color:"#0B0C0C",description:"No travel assessment is available."},
 GREEN:{title:"Travel at will",bg:"#00703C",color:"#FFFFFF",description:"Routine precautions are advised."},
 YELLOW:{title:"Travel with increased caution",bg:"#FFDD00",color:"#0B0C0C",description:"Review local conditions and plan carefully."},
 AMBER:{title:"Avoid all non-essential travel",bg:"#F47738",color:"#0B0C0C",description:"Avoid non-essential travel until conditions improve."},
 RED:{title:"Avoid all travel",bg:"#D4351C",color:"#FFFFFF",description:"Do not travel until further notice due to the current security assessment."},
 BLACK:{title:"Travel banned by GAC.CA",bg:"#0B0C0C",color:"#FFFFFF",description:"Travel is prohibited in this current assessment."}
};
export const travelNotices = [
 {country:"Ireland",level:"RED" as TravelLevel,updated:"2026-08-01 09:00",text:"Security notice: avoid all travel pending further review."},
 {country:"Finland",level:"GREEN" as TravelLevel,updated:"2026-07-28 12:30",text:"Routine travel may proceed in this current assessment."},
 {country:"Lebanon",level:"AMBER" as TravelLevel,updated:"2026-07-25 16:00",text:"Avoid non-essential travel while regional conditions remain unstable."},
 {country:"Ukraine",level:"RED" as TravelLevel,updated:"2026-08-02 08:15",text:"Notice: avoid all travel until further notice."},
 {country:"Germany",level:"GREEN" as TravelLevel,updated:"2026-07-30 11:45",text:"Routine precautions are recommended for travel."}
];
export const recognitionRecords = [
 {name:"Dominican Republic",capital:"Santo Domingo",status:"RECOGNISED",lat:18.4861,lng:-69.9312,summary:"Bilateral relationship record.",treaties:["Cultural Cooperation Framework","Consular Dialogue Memorandum"]},
 {name:"Falkland Islands",capital:"Stanley",status:"LIMITED",lat:-51.7963,lng:-59.5236,summary:"Limited engagement; consult the record's conditions.",treaties:["Maritime Communication Protocol"]},
 {name:"Finland",capital:"Helsinki",status:"RECOGNISED",lat:60.1699,lng:24.9384,summary:"Diplomatic relationship record.",treaties:["Northern Cooperation Accord"]},
 {name:"Germany",capital:"Berlin",status:"RECOGNISED",lat:52.52,lng:13.405,summary:"Diplomatic relationship record.",treaties:["Bilateral Consultation Agreement"]},
 {name:"Ireland",capital:"Dublin",status:"SUSPENDED",lat:53.3498,lng:-6.2603,summary:"Relationship status: suspended.",treaties:["Dialogue Framework (suspended in scenario)"]},
 {name:"Lebanon",capital:"Beirut",status:"LIMITED",lat:33.8938,lng:35.5018,summary:"Limited engagement and public advisory markers.",treaties:["Consular Coordination Note"]},
 {name:"Northern Ireland",capital:"Belfast",status:"SUSPENDED",lat:54.5973,lng:-5.9301,summary:"Operational record.",treaties:["Community Liaison Protocol"]},
 {name:"Ukraine",capital:"Kyiv",status:"LIMITED",lat:50.4501,lng:30.5234,summary:"Operational context record.",treaties:["Emergency Coordination Framework"]},
 {name:"United States",capital:"Washington, D.C.",status:"RECOGNISED",lat:38.9072,lng:-77.0369,summary:"Diplomatic relationship record.",treaties:["Bilateral Consultation Agreement"]}
];
export const publications=[{department:"Ministry of Defence",date:"1 August 2026",title:"MOD Document 04",summary:"Ministry of Defence document.",href:"/publications#mod-document-04"},{department:"Global Affairs Canada",date:"28 July 2026",title:"Foreign Relations Brief 12",summary:"Public summary of diplomatic activity.",href:"/publications#foreign-relations-brief-12"},{department:"Public Safety Office",date:"25 July 2026",title:"Public Guidance Notice 08",summary:"Preparedness guidance.",href:"/publications#public-guidance-notice-08"}];
