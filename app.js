/* AgriRenta web app (demo). Data is saved in localStorage for now.
   When we move to React + Supabase, the db object below becomes Supabase tables. */

/* ---------- Data ---------- */
const IMG = {
  tractor: "images/Agricultural Machinery .png", harvester: "images/harves.png", tiller: "images/Tiller Neon .png",
  rotary: "images/Rotary Tiller .png", pump: "images/Water Pump .png", thresher: "images/Thresher .png",
  sprayer: "images/Neon Green Agricultural Sprayer Showcase.png"
};
const CATS = ["All types", "Tractors", "Harvesters", "Tillers", "Harvesting tools", "Post-harvest", "Hand tools", "Powered tools", "Livestock", "Aquaculture", "Safety gear", "Transport", "Others"];
const LOCATIONS = ["Bunawan Brook, Bunawan, Agusan del Sur","Consuelo, Bunawan, Agusan del Sur","Imelda, Bunawan, Agusan del Sur","Libertad, Bunawan, Agusan del Sur","Mambalili, Bunawan, Agusan del Sur","Nueva Era, Bunawan, Agusan del Sur","Poblacion, Bunawan, Agusan del Sur","San Andres, Bunawan, Agusan del Sur","San Marcos, Bunawan, Agusan del Sur","San Teodoro, Bunawan, Agusan del Sur"];
const ROLE_LABEL = {customer:"Customer", owner:"Equipment Owner", admin:"Admin"};
const categoryImage = {Tractors:IMG.tractor, Harvesters:IMG.harvester, Tillers:IMG.tiller, Others:IMG.pump};
const J = "juan@example.com", ALEX = "alex.santos@example.com";
const eq = (id, name, spec, cat, img, price, rating, n) => ({ id, name, spec, cat, img, price, rating, n, owner: J });
const SAMPLE_OWNERS = [
  "owner.demo01@example.com", "owner.demo02@example.com", "owner.demo03@example.com", "owner.demo04@example.com",
  "owner.demo05@example.com", "owner.demo06@example.com", "owner.demo07@example.com", "owner.demo08@example.com"
];
const SAMPLE_PALETTE = [
  ["#e8f4dc","#366b43","#b5d77d"], ["#dceefa","#315c83","#74acd4"], ["#f8ead2","#87562e","#e8b866"],
  ["#f2e3ee","#754a68","#c98cb4"], ["#deeee9","#357267","#8dcec0"], ["#f3e5d7","#854a32","#d99468"],
  ["#e7e5f6","#554b84","#a49bd7"], ["#f5edcf","#746332","#ccb956"], ["#d9ecef","#376a73","#87c2c7"],
  ["#f3e2d9","#824d45","#d28d7e"], ["#e5eedc","#4e6840","#9ebd78"], ["#eee1f2","#6f4a79","#ba94c4"],
  ["#f4e8d0","#785b32","#cda85f"], ["#dce5f4","#3d527c","#8ca3d1"], ["#e8e4de","#51504d","#aaa49a"],
  ["#f5dfe6","#874c5b","#d88b9f"]
];
const LEGACY_SAMPLE_AVATARS = new Set([
  "images/profile1.png","images/profile2.jpg","images/profile3.jpg","images/profile3.png","images/romy.jpg",
  "images/faith.jpg","images/greg.jpg","images/kimberly.jpg","images/dennis.jpg"
]);
const sampleArtwork = (svg) => `data:image/svg+xml,${encodeURIComponent(svg)}`;
const samplePortrait = (index) => {
  const [background, shirt, accent] = SAMPLE_PALETTE[index % SAMPLE_PALETTE.length];
  const hair = ["#342a24","#242a35","#493321","#30242e","#513b29","#272727","#5a392d","#2b3038","#49362e","#272b38","#64452f","#3c2b36","#745543","#33312c","#513a3c","#2e3740"][index % 16];
  const hairstyle = [
    `<path d="M66 107c-9-56 4-84 47-84s57 31 44 85l-13-15-5-35c-15 10-41 13-65 4l-1 35z" fill="${hair}"/>`,
    `<path d="M63 101c-8-51 9-79 50-79s59 33 47 82l-18-8-3-31c-17 11-43 12-64 4l-3 32z" fill="${hair}"/>`,
    `<path d="M65 103c-8-52 8-81 48-81s58 32 48 82l-12-13-4-36c-16 12-43 13-65 5l-3 34z" fill="${hair}"/>`,
    `<path d="M65 102c-8-53 8-80 47-80s59 32 49 83l-13-13-3-33c-19 10-43 13-64 4l-3 34z" fill="${hair}"/>`,
    `<path d="M63 104c-5-55 12-82 49-82 42 0 59 32 48 82l-16-13-1-35c-21 13-43 13-65 3l-2 37z" fill="${hair}"/><path d="M67 52q43-43 87 2" fill="none" stroke="${accent}" stroke-width="8"/>`,
    `<path d="M64 103c-8-49 10-81 48-81 40 0 58 31 50 82l-18-12-2-36c-18 12-43 13-62 5l-3 34z" fill="${hair}"/><circle cx="151" cy="50" r="13" fill="${accent}"/>`,
    `<path d="M62 105c-7-56 12-83 50-83 43 0 61 33 49 84l-13-14-4-31c-17 11-43 12-64 4l-2 36z" fill="${hair}"/><path d="M71 48q-7-24-19-20m94 16q17-21 29-8" fill="none" stroke="${hair}" stroke-width="10" stroke-linecap="round"/>`,
    `<path d="M65 102c-9-53 8-80 45-80 40 0 58 30 53 81l-17-12-3-34c-19 10-42 12-61 4l-3 34z" fill="${hair}"/><path d="M74 31l-8-14m86 17 10-13" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>`,
    `<path d="M64 101c-8-52 10-79 47-79 40 0 59 31 50 81l-13-11-3-37c-18 13-44 13-64 4l-3 34z" fill="${hair}"/><path d="M74 37q35-25 71 0" fill="none" stroke="${accent}" stroke-width="6"/>`,
    `<path d="M64 105c-5-54 11-83 47-83 42 0 60 33 50 83l-15-13-3-35c-19 12-44 13-63 4l-3 34z" fill="${hair}"/><circle cx="77" cy="55" r="7" fill="${accent}"/><circle cx="145" cy="53" r="7" fill="${accent}"/>`,
    `<path d="M63 103c-6-51 12-81 49-81 40 0 58 32 49 81l-15-13-2-34c-20 11-44 14-65 4l-2 36z" fill="${hair}"/><path d="M79 29l8-13m48 13 9-12" stroke="${hair}" stroke-width="9" stroke-linecap="round"/>`
  ][index % 16];
  return sampleArtwork(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220"><rect width="220" height="220" rx="34" fill="${background}"/><circle cx="110" cy="104" r="77" fill="${accent}" opacity=".28"/><path d="M34 220c7-48 34-71 76-71s69 23 76 71" fill="${shirt}"/><path d="M91 137h38v39H91z" fill="#b97852"/><ellipse cx="110" cy="99" rx="48" ry="57" fill="#c98c68"/>${hairstyle}<path d="M88 100h8m36 0h8" stroke="#382b27" stroke-width="5" stroke-linecap="round"/><path d="M103 122q7 6 14 0" fill="none" stroke="#774638" stroke-width="3" stroke-linecap="round"/><path d="M85 174l25 18 25-18 17 46H68z" fill="${shirt}"/><circle cx="46" cy="45" r="9" fill="${accent}"/><circle cx="178" cy="57" r="6" fill="${shirt}"/></svg>`);
};
const equipmentGlyph = (name, category) => {
  const text = name.toLowerCase();
  if (/combine harvester|tractor|truck|trailer|tricycle|motorcycle|wheelbarrow|cart|dolly/.test(text)) return "🚜";
  if (/reaper|mower|sickle|scythe|knife|machete|bolo|axe|chainsaw|saw|pruning shear|hedge trimmer|brush cutter|cutter/.test(text)) return "🌾";
  if (/shovel|spade|hoe|rake|pickaxe|crowbar|fork|trowel|cultivator|weeder|digging bar|post hole|pala|piko|asarol|barena|wasay/.test(text)) return "🪏";
  if (/harvest basket|crates|sacks|sako|egg tray|pallet|tarpaulin|drying mat|pond liner|loading ramp/.test(text)) return "🧺";
  if (/rice thresher|sheller|mill|huller|dryer|winnower|cleaner|silo|storage|copra|dehusker|sorter|grader|conveyor|baler/.test(text)) return "🌾";
  if (/moisture meter|weighing scale|scale|generator|drill|grinder|welding|compressor|incubator|milking|mixer|pump|aerator|feeder/.test(text)) return "⚙️";
  if (/gloves|boots|mask|respirator|goggles|glasses|salakot|hat|raincoat|ear protection|protective suit|long sleeves|vest/.test(text)) return "🧤";
  if (/fish net|net|seine/.test(text)) return "🎣";
  if (/fence|wire|trough|cage|pen/.test(text)) return "🛠️";
  if (/wrench|screwdriver|hammer|pliers|hand saw/.test(text)) return "🔧";
  if (/fruit picker|fruit|coconut/.test(text)) return "🧑‍🌾";
  if (category === "Livestock") return "🐄";
  if (category === "Aquaculture") return "🐟";
  return "🌱";
};
const sampleEquipmentImage = (name, category, index) => {
  const [background, foreground, accent] = SAMPLE_PALETTE[(index + 2) % SAMPLE_PALETTE.length];
  const label = name.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const glyph = equipmentGlyph(name, category);
  return sampleArtwork(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420"><rect width="640" height="420" fill="${background}"/><path d="M0 315q145-55 320 0t320 0v105H0z" fill="${accent}" opacity=".35"/><circle cx="320" cy="170" r="112" fill="#fff" opacity=".58"/><text x="320" y="212" text-anchor="middle" font-size="145" font-family="Segoe UI Emoji,Apple Color Emoji,sans-serif">${glyph}</text><rect x="22" y="335" width="596" height="62" rx="18" fill="${foreground}"/><text x="320" y="375" text-anchor="middle" font-size="23" font-weight="700" font-family="Arial,sans-serif" fill="#fff">${label}</text><circle cx="48" cy="46" r="10" fill="${accent}"/><circle cx="590" cy="60" r="7" fill="${foreground}" opacity=".7"/></svg>`);
};
const SAMPLE_PROFILE_PHOTOS = {
  "owner.demo01@example.com":"images/Mila's Harvest Services.jpg",
  "owner.demo02@example.com":"images/Bunawan Farm Tools.jpg",
  "owner.demo03@example.com":"images/Ramon Villanueva.jpg",
  "owner.demo04@example.com":"images/Green Fields Equipment.jpg",
  "customer.demo01@example.com":"images/Rica Mendoza.jpg",
  "customer.demo06@example.com":"images/Noel Bautista.jpg",
  "customer.demo07@example.com":"images/Carmen Dizon.jpg",
  "customer.demo08@example.com":"images/eddie ramos.jpg"
};
const SAMPLE_EQUIPMENT_PHOTOS = {
  "combine-harvester":"images/Combine harvester.jpg",
  "reaper-mower":"images/Reaper mower.jpg",
  "sickle":"images/Sickle garab karit.jpg",
  "scythe":"images/Scythe.jpg",
  "harvesting-knife":"images/Harvesting knife.jpg",
  "pruning-shears":"images/Pruning shears secateurs.jpg",
  "hedge-trimmer":"images/Hedge trimmer.jpg",
  "corn-harvester":"images/Corn harvester  corn picker.jpg",
  "sugarcane-harvester":"images/Sugarcane harvester.jpg",
  "rice-reaper-binder":"images/Rice reaper-binder.jpg",
  "cutting-machete":"images/Cutting machete (bolo).jpg",
  "fruit-picker-pole":"images/Fruit picker pole.jpg",
  "harvest-basket-crates":"images/Harvest basket crates.jpg",
  "sacks":"images/Sacks sako.png",
  "gloves":"images/Farm work gloves.jpg",
  "rice-thresher":"images/Rice thresher.jpg",
  "corn-sheller":"images/Corn sheller.jpg",
  "rice-mill-huller":"images/Rice mill  huller Farm-ready rental · Post-harvest.jpg",
  "mechanical-grain-dryer":"images/Grain dryer mechanical.jpg",
  "grain-cleaner-winnower":"images/Grain cleaner  winnower.jpg",
  "moisture-meter":"images/Moisture meter.jpg",
  "platform-hanging-scale":"images/Weighing scale platform  hanging.png",
  "sack-sewing-machine":"images/Sack sewing machine.jpg",
  "tarpaulin-drying-mats":"images/Tarpaulin drying mats.jpg",
  "grain-storage-silo":"images/Grain storage binsilo.jpg",
  "pallets":"images/Pallets.jpg",
  "cold-storage":"images/Cold storage.jpg",
  "packing-crates-baskets":"images/Packing crates  baskets.jpg",
  "fruit-sorter-grader":"images/Fruit sorter grader.jpg",
  "coconut-dehusker":"images/Coconut dehusker.jpg",
  "copra-dryer":"images/Copra dryer.jpg",
  "shovel":"images/Shovel pala.jpg",
  "spade":"images/Spade.jpg",
  "hoe":"images/Hoe asarol piko.png",
  "rake":"images/Rake kalaykay.jpg",
  "pickaxe":"images/Pickaxe.jpg",
  "crowbar":"images/Crowbar (barena).jpg",
  "bolo-machete":"images/Bolo machete.jpg",
  "axe":"images/Axe wasay.jpg",
  "garden-fork":"images/Garden fork.jpg",
  "trowel":"images/Trowel.jpg",
  "hand-cultivator":"images/Hand cultivator.jpg",
  "weeder":"images/Weeder.jpg",
  "digging-bar":"images/Digging bar.jpg",
  "post-hole-digger":"images/Post hole digger.jpg",
  "hammer":"images/Hammer.jpg",
  "pliers":"images/Pliers.jpg",
  "wrench-set":"images/Wrench set.jpg",
  "screwdriver-set":"images/Screwdriver set.jpg",
  "hand-saw":"images/Hand saw.jpg",
  "pruning-saw":"images/Pruning saw.jpg",
  "wheelbarrow":"images/Wheelbarrow (carreton).jpg",
  "carrying-pole":"images/Sling carrying pole pasanan.jpg",
  "chainsaw":"images/Chainsaw.png",
  "brush-cutter":"images/Brush cutter  grass trimmer.jpg",
  "powered-hedge-trimmer":"images/Hedge trimmer powered.jpg",
  "small-power-tiller":"images/Power tiller small.jpg",
  "earth-auger":"images/Earth auger.jpg",
  "generator":"images/Generator.jpg",
  "electric-drill":"images/Electric drill.jpg",
  "angle-grinder":"images/Angle grinder.jpg",
  "welding-machine":"images/Welding machine.jpg",
  "air-compressor":"images/Air compressor.jpg",
  "feeders-waterers":"images/Feeders and waterers.jpg",
  "cages-pens":"images/Cages  pens.jpg",
  "egg-tray":"images/Egg tray.jpg",
  "milking-machine":"images/Milking machine.jpg",
  "animal-weighing-scale":"images/Animal weighing scale.jpg",
  "feed-mixer-grinder":"images/Feed mixer  grinder.jpg",
  "hay-baler":"images/Hay baler.jpg",
  "fence-posts-wire":"images/Fence posts and barbed wire.jpg",
  "electric-fence":"images/Electric fence.jpg",
  "troughs":"images/Animal troughs.jpg",
  "aerator-paddle-wheel":"images/Aerator paddle wheel.jpg",
  "fish-net":"images/Fish net.jpg",
  "fish-feeder":"images/Fish feeder.jpg",
  "fishpond-pump":"images/Fishpond pump.jpg",
  "pond-liner":"images/Pond liner.jpg",
  "harvesting-net-seine":"images/Harvesting net seine.jpg",
  "rubber-boots":"images/Rubberboots botas.jpg",
  "farm-gloves":"images/Gloves.jpg",
  "spray-respirator":"images/Face mask respirator pangspray.jpg",
  "safety-goggles":"images/Goggles safety glasse.jpg",
  "salakot":"images/Hat salakot.jpg",
  "raincoat":"images/Raincoat.jpg",
  "ear-protection":"images/Ear protection.jpg",
  "protective-suit":"images/Long sleeves  protective suit.jpg",
  "reflective-vest":"images/Reflective vest.jpg",
  "pickup-farm-truck":"images/Pickup truck farm truck.jpg",
  "tractor-trailer":"images/Trailer tractor trailer.jpg",
  "carabao-cart":"images/Carabao cart sled.jpg",
  "cargo-tricycle":"images/Tricycle cargo.jpg",
  "conveyor-belt":"images/Conveyor belt.jpg",
  "loading-ramp":"images/Loading ramp.jpg"
};
const SAMPLE_USERS = [
  {email:SAMPLE_OWNERS[0],name:"Mila's Harvest Services",role:"owner",phone:"0917 410 2001"},
  {email:SAMPLE_OWNERS[1],name:"Bunawan Farm Tools",role:"owner",phone:"0917 410 2002"},
  {email:SAMPLE_OWNERS[2],name:"Ramon Villanueva",role:"owner",phone:"0917 410 2003"},
  {email:SAMPLE_OWNERS[3],name:"Green Fields Equipment",role:"owner",phone:"0917 410 2004"},
  {email:SAMPLE_OWNERS[4],name:"Liza Mae Farm Rentals",role:"owner",phone:"0917 410 2005"},
  {email:SAMPLE_OWNERS[5],name:"Davao Agri Tools",role:"owner",phone:"0917 410 2006"},
  {email:SAMPLE_OWNERS[6],name:"Nestor's Farm Supply",role:"owner",phone:"0917 410 2007"},
  {email:SAMPLE_OWNERS[7],name:"Agusan Farm Equipment",role:"owner",phone:"0917 410 2008"},
  {email:"customer.demo01@example.com",name:"Rica Mendoza",role:"customer",phone:"0918 520 3001"},
  {email:"customer.demo02@example.com",name:"Paolo Garcia",role:"customer",phone:"0918 520 3002"},
  {email:"customer.demo03@example.com",name:"Ana Mae Flores",role:"customer",phone:"0918 520 3003"},
  {email:"customer.demo04@example.com",name:"Mark Anthony Cruz",role:"customer",phone:"0918 520 3004"},
  {email:"customer.demo05@example.com",name:"Jessa Lim",role:"customer",phone:"0918 520 3005"},
  {email:"customer.demo06@example.com",name:"Noel Bautista",role:"customer",phone:"0918 520 3006"},
  {email:"customer.demo07@example.com",name:"Carmen Dizon",role:"customer",phone:"0918 520 3007"},
  {email:"customer.demo08@example.com",name:"Eddie Ramos",role:"customer",phone:"0918 520 3008"}
].map((user,index) => ({...user,address:LOCATIONS[index % LOCATIONS.length],avatar:SAMPLE_PROFILE_PHOTOS[user.email] || samplePortrait(index),pw:undefined,sampleAccount:true,
  idDocs:{type:"Sample PhilSys ID (demo)",front:"images/front id 1.jpg",back:"images/back id 1.jpg",selfie:samplePortrait(index),submittedAt:"2026-10-27T10:00:00.000Z"},
  v:{mobile:1,email:1,id:"review",selfie:"review"}}));
const SAMPLE_EQUIPMENT = [
  ["combine-harvester","Combine harvester","Harvesters",4500,"harvester"],
  ["reaper-mower","Reaper / mower","Harvesting tools",1200,"harvester"],
  ["sickle","Sickle (garab / karit)","Hand tools",80,"tiller"],
  ["scythe","Scythe","Hand tools",150,"tiller"],
  ["harvesting-knife","Harvesting knife","Hand tools",100,"tiller"],
  ["pruning-shears","Pruning shears / secateurs","Hand tools",120,"tiller"],
  ["hedge-trimmer","Hedge trimmer","Powered tools",650,"sprayer"],
  ["corn-harvester","Corn harvester / corn picker","Harvesters",2500,"harvester"],
  ["sugarcane-harvester","Sugarcane harvester","Harvesters",4000,"harvester"],
  ["rice-reaper-binder","Rice reaper-binder","Harvesters",1800,"harvester"],
  ["cutting-machete","Cutting machete (bolo)","Hand tools",100,"tiller"],
  ["fruit-picker-pole","Fruit picker pole","Harvesting tools",100,"tiller"],
  ["harvest-basket-crates","Harvest basket / crates","Harvesting tools",80,"thresher"],
  ["sacks","Sacks (sako)","Harvesting tools",20,"thresher"],
  ["gloves","Farm work gloves","Safety gear",40,"sprayer"],
  ["rice-thresher","Rice thresher","Post-harvest",1200,"thresher"],
  ["corn-sheller","Corn sheller","Post-harvest",900,"thresher"],
  ["rice-mill-huller","Rice mill / huller","Post-harvest",1800,"thresher"],
  ["mechanical-grain-dryer","Grain dryer (mechanical)","Post-harvest",3000,"thresher"],
  ["grain-cleaner-winnower","Grain cleaner / winnower","Post-harvest",700,"thresher"],
  ["moisture-meter","Moisture meter","Post-harvest",250,"pump"],
  ["platform-hanging-scale","Weighing scale (platform / hanging)","Post-harvest",180,"pump"],
  ["sack-sewing-machine","Sack sewing machine","Post-harvest",300,"thresher"],
  ["tarpaulin-drying-mats","Tarpaulin / drying mats","Post-harvest",100,"thresher"],
  ["grain-storage-silo","Grain storage bin / silo","Post-harvest",500,"thresher"],
  ["pallets","Pallets","Post-harvest",80,"thresher"],
  ["cold-storage","Cold storage","Post-harvest",3500,"pump"],
  ["packing-crates-baskets","Packing crates / baskets","Post-harvest",80,"thresher"],
  ["fruit-sorter-grader","Fruit sorter / grader","Post-harvest",1200,"thresher"],
  ["coconut-dehusker","Coconut dehusker","Post-harvest",700,"thresher"],
  ["copra-dryer","Copra dryer","Post-harvest",1500,"thresher"],
  ["shovel","Shovel (pala)","Hand tools",100,"tiller"],
  ["spade","Spade","Hand tools",100,"tiller"],
  ["hoe","Hoe (asarol / piko)","Hand tools",100,"tiller"],
  ["rake","Rake (kalaykay)","Hand tools",80,"tiller"],
  ["pickaxe","Pickaxe","Hand tools",120,"tiller"],
  ["crowbar","Crowbar (barena)","Hand tools",120,"tiller"],
  ["bolo-machete","Bolo / machete","Hand tools",100,"tiller"],
  ["axe","Axe (wasay)","Hand tools",150,"tiller"],
  ["garden-fork","Garden fork","Hand tools",100,"tiller"],
  ["trowel","Trowel","Hand tools",60,"tiller"],
  ["hand-cultivator","Hand cultivator","Hand tools",100,"tiller"],
  ["weeder","Weeder","Hand tools",80,"tiller"],
  ["digging-bar","Digging bar","Hand tools",120,"tiller"],
  ["post-hole-digger","Post hole digger","Hand tools",150,"tiller"],
  ["hammer","Hammer","Hand tools",80,"tiller"],
  ["pliers","Pliers","Hand tools",60,"tiller"],
  ["wrench-set","Wrench set","Hand tools",100,"tiller"],
  ["screwdriver-set","Screwdriver set","Hand tools",80,"tiller"],
  ["hand-saw","Hand saw","Hand tools",80,"tiller"],
  ["pruning-saw","Pruning saw","Hand tools",100,"tiller"],
  ["wheelbarrow","Wheelbarrow (carreton)","Transport",180,"rotary"],
  ["carrying-pole","Sling / carrying pole (pasanan)","Transport",80,"rotary"],
  ["chainsaw","Chainsaw","Powered tools",700,"sprayer"],
  ["brush-cutter","Brush cutter / grass trimmer","Powered tools",500,"sprayer"],
  ["powered-hedge-trimmer","Hedge trimmer (powered)","Powered tools",600,"sprayer"],
  ["small-power-tiller","Power tiller (small)","Tillers",900,"tiller"],
  ["earth-auger","Earth auger","Powered tools",450,"sprayer"],
  ["generator","Generator","Powered tools",800,"pump"],
  ["electric-drill","Electric drill","Powered tools",180,"sprayer"],
  ["angle-grinder","Angle grinder","Powered tools",180,"sprayer"],
  ["welding-machine","Welding machine","Powered tools",500,"sprayer"],
  ["air-compressor","Air compressor","Powered tools",350,"pump"],
  ["feeders-waterers","Feeders and waterers","Livestock",100,"pump"],
  ["cages-pens","Cages / pens","Livestock",150,"rotary"],
  ["incubator","Incubator","Livestock",350,"pump"],
  ["egg-tray","Egg tray","Livestock",30,"thresher"],
  ["milking-machine","Milking machine","Livestock",1200,"pump"],
  ["animal-weighing-scale","Animal weighing scale","Livestock",250,"pump"],
  ["feed-mixer-grinder","Feed mixer / grinder","Livestock",700,"thresher"],
  ["hay-baler","Hay baler","Livestock",1800,"harvester"],
  ["fence-posts-wire","Fence posts and barbed wire","Livestock",150,"rotary"],
  ["electric-fence","Electric fence","Livestock",300,"rotary"],
  ["troughs","Animal troughs","Livestock",80,"pump"],
  ["aerator-paddle-wheel","Aerator / paddle wheel","Aquaculture",500,"pump"],
  ["fish-net","Fish net","Aquaculture",100,"rotary"],
  ["fish-feeder","Fish feeder","Aquaculture",150,"pump"],
  ["fishpond-pump","Fishpond pump","Aquaculture",450,"pump"],
  ["pond-liner","Pond liner","Aquaculture",250,"rotary"],
  ["harvesting-net-seine","Harvesting net / seine","Aquaculture",200,"rotary"],
  ["rubber-boots","Rubber boots (botas)","Safety gear",80,"sprayer"],
  ["farm-gloves","Gloves","Safety gear",40,"sprayer"],
  ["spray-respirator","Face mask / respirator (pang-spray)","Safety gear",50,"sprayer"],
  ["safety-goggles","Goggles / safety glasses","Safety gear",40,"sprayer"],
  ["salakot","Hat / salakot","Safety gear",40,"sprayer"],
  ["raincoat","Raincoat","Safety gear",60,"sprayer"],
  ["ear-protection","Ear protection","Safety gear",50,"sprayer"],
  ["protective-suit","Long sleeves / protective suit","Safety gear",100,"sprayer"],
  ["reflective-vest","Reflective vest","Safety gear",50,"sprayer"],
  ["pickup-farm-truck","Pickup truck / farm truck","Transport",2500,"tractor"],
  ["tractor-trailer","Trailer (tractor trailer)","Transport",1000,"rotary"],
  ["carabao-cart","Carabao cart / sled","Transport",350,"rotary"],
  ["hand-truck-dolly","Hand truck / dolly","Transport",150,"rotary"],
  ["motorcycle-sidecar","Motorcycle with sidecar (habal-habal cargo)","Transport",800,"tractor"],
  ["cargo-tricycle","Tricycle cargo","Transport",900,"tractor"],
  ["conveyor-belt","Conveyor belt","Transport",700,"thresher"],
  ["loading-ramp","Loading ramp","Transport",200,"rotary"]
].map(([id,name,cat,price],index) => ({
  id:`sample-${id}`,name,spec:`Farm-ready rental · ${cat}`,cat,img:SAMPLE_EQUIPMENT_PHOTOS[id] || sampleEquipmentImage(name,cat,index),price,rating:4.6,n:0,
  owner:SAMPLE_OWNERS[index % SAMPLE_OWNERS.length],location:LOCATIONS[index % LOCATIONS.length],
  status:"approved",visible:true,sampleListing:true
}));
const SAMPLE_MESSAGES = (() => {
  const customers = SAMPLE_USERS.filter(user => user.role === "customer");
  const owners = SAMPLE_USERS.filter(user => user.role === "owner");
  const adminEmail = "ops@agrirenta.example";
  const customerTexts = [
    "Maayong buntag! Available pa ba ang makina para sa uma karong semanaha?",
    "Salamat kaayo, klaro kaayo ang detalye ug presyo sa listing.",
    "Pwede ba pickup sa Poblacion? Magdala ko og sakyanan.",
    "Nindot ang hulagway ug kompleto ang impormasyon sa gamit.",
    "Unsa oras pwede makuha ang kagamitan? Salamat daan.",
    "Maayo kaayo ang serbisyo, dali ra kaayo ta nagkasabot."
  ];
  const ownerTexts = [
    "Maayong adlaw! Salamat sa pag-message, available pa among kagamitan.",
    "Oo, pwede ra pickup sa inyong gipili nga lokasyon.",
    "Andam na ang makina. Palihog lang ko og pahibalo sa oras sa pickup.",
    "Salamat sa feedback! Ampingan namo pirmi ang among mga gamit.",
    "Naa mi lain nga gamit sa Agusan del Sur kung kinahanglan pa nimo.",
    "Sige, magkasinabot ta sa oras ug detalye sa pag-abang."
  ];
  const adminTexts = [
    "Salamat sa inyong mensahe! Naa mi kung kinahanglan mo og tabang.",
    "Nadawat namo inyong pangutana. Palihog tan-awa ang detalye sa listing.",
    "Maayong adlaw! Matabangan namo mo sa inyong pag-abang.",
    "Salamat sa pag-update. Magpabilin mi nga available para ninyo."
  ];
  const messages = [];
  let sequence = 0;
  const add = (thread, author, text) => {
    const day = 25 + sequence % 4;
    const hour = 8 + sequence % 10;
    messages.push({
      id:`sample-message-v2-${String(sequence + 1).padStart(3,"0")}`,
      thread,from:thread,author,text,
      time:new Date(Date.UTC(2026,9,day,hour,sequence % 60)).toISOString()
    });
    sequence++;
  };
  customers.forEach((customer,index) => {
    const owner = owners[index % owners.length];
    add(customer.email,customer.email,customerTexts[index % customerTexts.length]);
    add(customer.email,adminEmail,adminTexts[index % adminTexts.length]);
    add(customer.email,customer.email,customerTexts[(index + 3) % customerTexts.length]);
    add(customer.email,adminEmail,adminTexts[(index + 2) % adminTexts.length]);
    add(owner.email,customer.email,customerTexts[(index + 2) % customerTexts.length]);
    add(owner.email,adminEmail,adminTexts[(index + 1) % adminTexts.length]);
    add(owner.email,owner.email,ownerTexts[(index + 1) % ownerTexts.length]);
    add(owner.email,adminEmail,adminTexts[(index + 3) % adminTexts.length]);
  });
  return messages;
})();
const SAMPLE_REVIEWS = (() => {
  const customers = SAMPLE_USERS.filter(user => user.role === "customer");
  const owners = SAMPLE_USERS.filter(user => user.role === "owner");
  const customerFeedback = [
    "Maayo kaayo ang kagamitan, limpyo ug andam gamiton. Salamat sa tag-iya!",
    "Maabiabihon ang tag-iya ug patas ang presyo. Hapsay ang pickup.",
    "Maayo ang kalidad sa makina, dako og tabang sa among uma.",
    "Nindot ang serbisyo ug sayon ra kaayo ang sabot sa tag-iya.",
    "Maayo ang kondisyon sa gamit ug tukma sa oras ang paghatod.",
    "Salamat kaayo, limpyo ug kompleto ang kagamitan pag-abot.",
    "Paspas motubag ang tag-iya ug klaro ang mga kondisyon sa abang.",
    "Sulit kaayo ang abang, gamiton gihapon namo sunod ani."
  ];
  const ownerFeedback = [
    "Maayo kaistorya ug amping mogamit sa kagamitan. Salamat!",
    "Sayon sabton ug gituman ang sabot sa oras ug pickup.",
    "Maayo nga customer, matinahuron ug responsable sa gamit.",
    "Hapsay ang transaksyon ug gibalik ang kagamitan nga limpyo."
  ];
  return customers.flatMap((customer,index) => {
    const owner = owners[index % owners.length];
    const nextOwner = owners[(index + 1) % owners.length];
    const date = `Oct ${String(20 + index % 8).padStart(2,"0")}, 2026`;
    return [
      {type:"rental",bookingRef:`SAMPLE-REVIEW-C${index + 1}`,to:owner.email,from:customer.email,stars:5 - index % 2,text:customerFeedback[index % customerFeedback.length],date},
      {type:"rental",bookingRef:`SAMPLE-REVIEW-O${index + 1}`,to:customer.email,from:owner.email,stars:4 + index % 2,text:ownerFeedback[index % ownerFeedback.length],date},
      {type:"rental",bookingRef:`SAMPLE-REVIEW-X${index + 1}`,to:nextOwner.email,from:customer.email,stars:4 + index % 2,text:customerFeedback[(index + 3) % customerFeedback.length],date}
    ];
  });
})();
const SEED = {
  me: null,
  eq: [eq(1, "Farm Tractor", "50 HP · Diesel", "Tractors", "tractor", 2500, 4.8, 126), eq(2, "Rice Harvester", "High capacity", "Harvesters", "harvester", 4000, 4.9, 84),
    eq(3, "Power Tiller", "Compact · 7 HP", "Tillers", "tiller", 900, 4.6, 57), eq(4, "Utility Tractor", "4WD · 65 HP", "Tractors", "tractor", 3200, 4.7, 92),
    eq(5, "Rotary Tiller", "Tractor mounted", "Tillers", "rotary", 600, 4.8, 40), eq(6, "Water Pump", "3 inch · Gasoline", "Others", "pump", 500, 4.7, 31),
    eq(7, "Thresher", "Rice thresher", "Harvesters", "thresher", 1200, 4.5, 22), eq(8, "Power Sprayer", "Knapsack · 16 L", "Others", "sprayer", 300, 4.6, 18)],
  users: [
    { email: ALEX, name: "Alex Santos", role: "customer", phone: "0917 000 4821", pw: "demo1234", v: { mobile: 1, email: 1, id: "review", selfie: "review" } },
    { email: "maria@example.com", name: "Maria Dela Cruz", role: "customer", phone: "0917 111 2233", pw: "demo1234", v: { mobile: 1, email: 1, id: "ok", selfie: "ok" } },
    { email: "pedro@example.com", name: "Pedro Reyes", role: "customer", phone: "0917 222 3344", pw: "demo1234", v: { mobile: 1, email: 1, id: "ok", selfie: "ok" } },
    { email: J, name: "Juan's Farm Equipment", role: "owner", phone: "0918 000 2210", pw: "demo1234", v: { mobile: 1, email: 1, id: "ok", selfie: "ok", papers: "review" } },
    { email: "ops@agrirenta.example", name: "AgriRenta Ops", role: "admin", phone: "", pw: "demo1234", v: {} }],
  bookings: [
    { ref: "AR-2026-0103", eq: 3, renter: ALEX, owner: J, start: "2026-09-08", end: "2026-09-09", days: 1, total: 900, status: "returned", delivery: "Pickup", addr: "" },
    { ref: "AR-2026-0148", eq: 1, renter: "maria@example.com", owner: J, start: "2026-10-20", end: "2026-10-21", days: 1, total: 2500, status: "pending", delivery: "Delivery", addr: "Bunawan" },
    { ref: "AR-2026-0120", eq: 3, renter: "pedro@example.com", owner: J, start: "2026-10-22", end: "2026-10-23", days: 1, total: 900, status: "returned", delivery: "Pickup", addr: "" }],
  reviews: [
    { to: ALEX, from: J, stars: 5, text: "Alex returned the tiller on time and kept it clean. Easy to work with.", date: "Sep 10, 2026" },
    { to: J, from: "maria@example.com", stars: 5, text: "The tractor was clean and ran well all day. Delivery arrived early.", date: "Oct 02, 2026" },
    { to: J, from: "pedro@example.com", stars: 4, text: "Good machine at a fair price. Pickup took a little longer than planned.", date: "Sep 18, 2026" }]
};
let db;
try { db = JSON.parse(localStorage.getItem("agri") || "null") || structuredClone(SEED); }
catch (err) { db = structuredClone(SEED); }
const mergeSampleCatalog = (state) => {
  let changed = false;
  const emails = new Set(state.users.map(user => user.email));
  SAMPLE_USERS.forEach((user,index) => {
    if (!emails.has(user.email)) {
      state.users.push(structuredClone(user));
      emails.add(user.email);
      changed = true;
    } else {
      const existing = state.users.find(record => record.email === user.email);
      if (existing) {
        if (existing.sampleAccount !== true) {
          existing.sampleAccount = true;
          changed = true;
        }
        const desiredAvatar = SAMPLE_PROFILE_PHOTOS[user.email] || samplePortrait(index);
        if (LEGACY_SAMPLE_AVATARS.has(existing.avatar) || (typeof existing.avatar === "string" && existing.avatar.startsWith("data:image/svg+xml,"))) {
          existing.avatar = desiredAvatar;
          changed = true;
        }
        if (!existing.address) {
          existing.address = user.address;
          changed = true;
        }
        if (!existing.idDocs || existing.idDocs.type === "Sample PhilSys ID (demo)") {
          existing.idDocs = structuredClone(user.idDocs);
          existing.v = {...existing.v,id:"review",selfie:"review"};
          changed = true;
        }
      }
    }
  });
  const equipmentIds = new Set(state.eq.map(item => String(item.id)));
  SAMPLE_EQUIPMENT.forEach((item,index) => {
    if (!equipmentIds.has(String(item.id))) {
      state.eq.push(structuredClone(item));
      equipmentIds.add(String(item.id));
      changed = true;
    } else {
      const existing = state.eq.find(record => String(record.id) === String(item.id));
      if (existing && existing.img !== item.img) {
        existing.img = item.img;
        changed = true;
      }
    }
  });
  const messageIds = new Set(state.messages.map(message => String(message.id)));
  SAMPLE_MESSAGES.forEach(message => {
    if (!messageIds.has(String(message.id))) {
      state.messages.push(structuredClone(message));
      messageIds.add(String(message.id));
      changed = true;
    }
  });
  const reviewRefs = new Set(state.reviews.map(review => review.bookingRef).filter(Boolean));
  SAMPLE_REVIEWS.forEach(review => {
    if (!reviewRefs.has(review.bookingRef)) {
      state.reviews.push(structuredClone(review));
      reviewRefs.add(review.bookingRef);
      changed = true;
    }
  });
  return changed;
};
// Additive defaults keep existing saved demo data compatible with newer features.
db.favorites = db.favorites && typeof db.favorites === "object" && !Array.isArray(db.favorites) ? db.favorites : {};
db.availability = Array.isArray(db.availability) ? db.availability : [];
db.eq = Array.isArray(db.eq) ? db.eq : structuredClone(SEED.eq);
db.users = Array.isArray(db.users) ? db.users : structuredClone(SEED.users);
db.bookings = Array.isArray(db.bookings) ? db.bookings : [];
db.reviews = Array.isArray(db.reviews) ? db.reviews : [];
db.withdrawals = Array.isArray(db.withdrawals) ? db.withdrawals : [];
db.messages = Array.isArray(db.messages) ? db.messages : [];
db.notificationReads = db.notificationReads && typeof db.notificationReads === "object" ? db.notificationReads : {};
db.commissionWithdrawals = Array.isArray(db.commissionWithdrawals) ? db.commissionWithdrawals : [];
let demoCatalogChanged = mergeSampleCatalog(db);
if (demoCatalogChanged) {
  try { localStorage.setItem("agri", JSON.stringify(db)); }
  catch (err) { console.warn("AgriRenta sample catalog could not be saved to the local cache.", err); }
}
const normalizeState = (state) => {
  db = state;
  db.favorites = db.favorites && typeof db.favorites === "object" && !Array.isArray(db.favorites) ? db.favorites : {};
  db.availability = Array.isArray(db.availability) ? db.availability : [];
  db.eq = Array.isArray(db.eq) ? db.eq : structuredClone(SEED.eq);
  db.users = Array.isArray(db.users) ? db.users : structuredClone(SEED.users);
  db.bookings = Array.isArray(db.bookings) ? db.bookings : [];
  db.reviews = Array.isArray(db.reviews) ? db.reviews : [];
  db.withdrawals = Array.isArray(db.withdrawals) ? db.withdrawals : [];
  db.messages = Array.isArray(db.messages) ? db.messages : [];
  db.notificationReads = db.notificationReads && typeof db.notificationReads === "object" ? db.notificationReads : {};
  db.commissionWithdrawals = Array.isArray(db.commissionWithdrawals) ? db.commissionWithdrawals : [];
  const catalogChanged = mergeSampleCatalog(db);
  db.eq.forEach(e => { if (typeof e.location !== "string") e.location = ""; });
  db.users.forEach(user => { if (typeof user.avatar !== "string") user.avatar = ""; });
  return catalogChanged;
};
db.eq.forEach((e) => { if (typeof e.location !== "string") e.location = ""; });
db.users.forEach(u => { if (typeof u.avatar !== "string") u.avatar = ""; });
const readPendingState = () => {
  try {
    const saved = localStorage.getItem("agri_pending_sync");
    const state = saved ? JSON.parse(saved) : null;
    return state && typeof state === "object" && !Array.isArray(state) && Array.isArray(state.users) && Array.isArray(state.eq) ? state : null;
  } catch (err) {
    console.warn("AgriRenta pending server copy could not be read.", err);
    return null;
  }
};
let serverApiEnabled = false;
let rolePending = false; // true right after a first Google sign-in, until the person picks Customer or Equipment owner
const persistState = async () => {
  const snapshot = JSON.stringify(db);
  try { localStorage.setItem("agri", snapshot); }
  catch (err) { console.warn("AgriRenta local cache could not be saved", err); }
  if (!serverApiEnabled || !db.me) return;
  try {
    const response = await fetch("/api/state", { method:"PUT", credentials:"same-origin", headers:{"Content-Type":"application/json"}, body:JSON.stringify({state:db}) });
    let result = {};
    try { result = await response.json(); } catch {}
    if (!response.ok || !result.ok) throw new Error(result.error || (response.status === 413 ? "This upload is too large for the server. Please use smaller photos." : "AgriRenta server save failed."));
    try { localStorage.removeItem("agri_pending_sync"); }
    catch (cacheError) { console.warn("AgriRenta pending server copy could not be cleared.", cacheError); }
  } catch (err) {
    try { localStorage.setItem("agri_pending_sync", snapshot); }
    catch (cacheError) { console.warn("AgriRenta pending server copy could not be saved.", cacheError); }
    throw err;
  }
};
const save = () => persistState().then(() => true).catch(err => {
  console.error("AgriRenta server save failed; local cache remains available.", err);
  toast(`Server save failed: ${err.message || "Unknown error"}. Local copy remains on this device.`);
  return false;
});

/* ---------- Helpers ---------- */
const $ = (s) => document.querySelector(s), app = $("#app");
const peso = (n) => "₱" + Number(n).toLocaleString();
const img = (k) => typeof k === "string" && (k.startsWith("data:image/") || k.startsWith("https://") || k.startsWith("http://") || k.startsWith("images/")) ? k : encodeURI(IMG[k] || IMG.tractor);
const stars = (r) => `<span class="stars">${"★".repeat(Math.round(r))}${"☆".repeat(5 - Math.round(r))}</span>`;
const fmt = (d) => new Date(d + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const me = () => db.users.find((u) => u.email === db.me);
const usr = (e) => db.users.find((u) => u.email === e) || { name: e, v: {} };
const E = (id) => db.eq.find((e) => e.id == id);
const bookingEquipment = (b) => E(b.eq) || { id: b.eq, name: b.equipmentName || "Equipment listing", spec: "", img: "tractor", price: 0, rating: 0, n: 0, owner: b.owner || "", location: "" };
const threadOf = (message) => message.thread || message.from;
const go = (h) => { location.hash = h; };
const avg = (e) => { const r = db.reviews.filter((x) => x.to === e); return r.length ? { v: r.reduce((a, b) => a + b.stars, 0) / r.length, n: r.length } : null; };
const isVerified = (u) => u.v.id === "ok" && u.v.selfie === "ok";
const homeOf = (u) => ({ customer: "#/home", owner: "#/dashboard", admin: "#/admin" })[u.role];
const toast = (m) => { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2600); };
const initial = (n) => (n || "?")[0].toUpperCase();
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]);
const avatar = (u, size="") => `<span class="avatar ${size}" aria-label="${u.name} profile">${u.avatar ? `<img src="${u.avatar}" alt="${u.name} profile picture">` : `<span>${initial(u.name)}</span>`}</span>`;
const roleLabel = (u) => ROLE_LABEL[u?.role] || "Guest";
const profileHref = (email, viewer = me()) => `${viewer?.role === "admin" ? "#/user/" : "#/member/"}${encodeURIComponent(email)}`;
const locationText = (e) => e.location || "Location not set";
const dateKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`; };
const dayIsBooked = (eqId, day) => db.bookings.some(b => Number(b.eq) === Number(eqId) && ["pending","approved"].includes(b.status) && day >= b.start && day < b.end);
const dayIsBlocked = (eqId, day) => db.availability.some(x => Number(x.eq) === Number(eqId) && day >= x.start && day <= x.end);
const dayStatus = (eqId, day) => dayIsBooked(eqId, day) || dayIsBlocked(eqId, day);
const calendarDays = (eqId, count=30, draftMode=false) => Array.from({length:count}, (_,i) => { const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()+i); const key=dateKey(d); const booked=dayIsBooked(eqId,key); const blocked=dayIsBlocked(eqId,key); const chosen=draftMode && draftUnavailableDates.includes(key); const off=booked || blocked || chosen; return `<button type="button" class="owner-day ${off?'unavailable':'available'} ${chosen?'selected':''}" data-act="${draftMode?'draftday':'toggleavailability'}" data-v="${eqId||''}" data-date="${key}" ${booked&&!draftMode?'disabled title="Reserved by a customer"':''}><b>${d.toLocaleDateString('en-US',{weekday:'short'})}</b><strong>${d.getDate()}</strong><small>${booked?'Booked':(off?'Unavailable':'Available')}</small></button>`; }).join("");
const pill = (s) => `<span class="pill ${s === "pending" || s === "review" ? "warn" : s === "declined" ? "bad" : ""}">${s}</span>`;
const badge = (u) => (isVerified(u) ? `<span class="pill">✓ ID verified</span>` : `<span class="pill warn">Not verified</span>`);
let regRole = "customer", cat = "All types", q = "", idType = "PhilSys ID", draft = null, rate = { stars: 4, tags: [] }, maxPrice = "", sortBy = "recommended", draftUnavailableDates = [];

/* ---------- Views: each returns [html, "auth" | "app"] ---------- */
const authCard = (inner) => [`<main class="authwrap"><section class="glass authcard"><a href="index.html" class="logo" aria-label="Home"><img src="logo.png" alt="AgriRenta"></a>${inner}</section></main>`, "auth"];
const isFav = (e, email = db.me) => !!(email && (db.favorites[email] || []).map(String).includes(String(e)));
const eqCard = (e) => `<article class="neu card equipment-card"><a class="equipment-open" href="#/equipment/${e.id}"><img src="${img(e.img)}" alt="${e.name}"><h3>${e.name}</h3><p>${e.spec}</p></a>
  <p class="equipment-location"><i class="bi bi-geo-alt-fill" aria-hidden="true"></i> ${locationText(e)}</p>
  <div class="row"><span>${stars(e.rating)} <b>${e.rating}</b> <small>(${e.n})</small></span><button class="icon-btn ${isFav(e.id) ? "favorite-on" : ""}" type="button" aria-label="${isFav(e.id) ? "Remove from" : "Add to"} favorites" data-act="favorite" data-v="${e.id}"><i class="bi ${isFav(e.id) ? "bi-heart-fill" : "bi-heart"}" aria-hidden="true"></i></button></div><div class="row"><b class="price">${peso(e.price)} / day</b><i class="dot"></i></div><a class="equipment-owner-link" href="#/owner/${encodeURIComponent(e.owner)}">${avatar(usr(e.owner))}<span>Provided by <b>${escapeHtml(usr(e.owner).name)}</b></span></a></article>`;
const availableEquipment = () => db.eq.filter(e => (!e.status || e.status === "approved") && e.visible !== false);
const filteredAvailableEquipment = (term = "") => {
  const query = String(term || "").trim().toLowerCase();
  return availableEquipment().filter(e => !query || [e.name, e.spec, e.cat, e.location].join(" ").toLowerCase().includes(query));
};
const list = () => {
  let items = filteredAvailableEquipment(q).filter(e => (cat === "All types" || e.cat === cat) && (!maxPrice || Number(e.price) <= Number(maxPrice)));
  if (sortBy === "price-low") items.sort((a,b) => a.price-b.price);
  if (sortBy === "price-high") items.sort((a,b) => b.price-a.price);
  if (sortBy === "rating") items.sort((a,b) => b.rating-a.rating);
  if (sortBy === "saved") items = items.filter((e) => isFav(e.id));
  return items.map(eqCard).join("") || "<p>No equipment matches your search. Try changing your filters.</p>";
};
const chips = () => `<div class="chips">${CATS.map((c) => `<button class="chip ${c === cat ? "on" : ""}" data-act="cat" data-v="${c}">${c}</button>`).join("")}</div>`;
const platformSearchResults = (term, viewer) => {
  const query = String(term || "").trim().toLowerCase();
  if (!query) return `<p class="empty-state">Search people, equipment, or locations.</p>`;
  const isAdmin = viewer?.role === "admin";
  const users = db.users.filter(user => (isAdmin || user.role !== "admin")
    && [user.name, user.role, ...(isAdmin ? [user.email, user.phone, user.address] : [])].join(" ").toLowerCase().includes(query));
  const equipment = db.eq.filter(item => (isAdmin || item.owner === viewer?.email || ((!item.status || item.status === "approved") && item.visible !== false))
    && [item.name, item.spec, item.cat, item.location, usr(item.owner).name, ...(isAdmin ? [item.owner] : [])].join(" ").toLowerCase().includes(query));
  return `${users.length ? `<h3>Users (${users.length})</h3><div class="stack">${users.map(user => `<a class="neu item card admin-user-card" href="#/${isAdmin ? "user" : "member"}/${encodeURIComponent(user.email)}">${avatar(user)}<div><b>${escapeHtml(user.name)}</b><p>${isAdmin ? `${escapeHtml(user.email)} · ` : ""}${roleLabel(user)}</p></div><span>View profile →</span></a>`).join("")}</div>` : ""}
    ${equipment.length ? `<h3>Equipment (${equipment.length})</h3><div class="stack">${equipment.map(item => `<a class="neu item card" href="#/equipment/${encodeURIComponent(item.id)}"><img src="${img(item.img)}" alt="${escapeHtml(item.name)}" class="admin-search-equipment-image"><div><b>${escapeHtml(item.name)}</b><p>${escapeHtml(item.cat)} · ${escapeHtml(item.location || "Location not set")}</p><small>Owner: ${escapeHtml(usr(item.owner).name)}</small></div></a>`).join("")}</div>` : ""}
    ${!users.length && !equipment.length ? `<p class="empty-state">No users, equipment, or locations matched “${escapeHtml(term)}”.</p>` : ""}`;
};
const ownerListingPanel = (email, ownProfile) => {
  const listings = db.eq.filter(item => item.owner === email
    && (ownProfile || ((!item.status || item.status === "approved") && item.visible !== false)));
  return `<div class="row"><h2>Equipment listed</h2><span class="pill">${listings.length} ${ownProfile ? "listings" : "available listings"}</span></div>
    ${ownProfile && listings.some(item => item.status && item.status !== "approved")
      ? `<p class="neu owner-review-notice">Listings marked “review” are visible only to you and the admin. Customers can find and book them after admin approval.</p>` : ""}
    <div class="grid">${listings.map(item => `<div><div class="owner-profile-listing-status">${pill(item.status || "approved")}${item.visible === false ? `<span class="pill warn">Hidden</span>` : ""}</div>${eqCard(item)}</div>`).join("") || "<p>No approved equipment listings yet.</p>"}</div>`;
};

const V = {
  welcome: () => authCard(`<h1>Grow more. Rent smarter.</h1><p>Find trusted, verified farm equipment nearby and rent what you need, when you need it.</p>
    <a class="btn btn-primary btn-block" href="#/register">Get Started</a><a class="btn btn-soft btn-block" href="#/login">Log in</a><a class="link" href="#/explore">Continue as guest</a>`),

  login: () => authCard(`<h1 style="text-align:center;">Welcome</h1><p style="text-align:center;">Log in to continue your farming journey.</p>
    <form data-form="login"><label>Email address</label><input name="email" type="email" placeholder="you@example.com" required>
    <label>Password</label><input name="pw" type="password" placeholder="Enter your password" required>
    <label>2FA code (admin only)</label><input name="code" inputmode="numeric" placeholder="6-digit code">
    <p style="text-align:right;margin:.5rem 0 0"><a href="#" data-act="forgot"><b>Forgot password?</b></a></p>
    <button class="btn btn-primary btn-block">Log In</button></form>
    <p style="text-align:center;margin:.8rem 0 0">or continue with</p>
    <button class="btn btn-soft btn-block google-login" data-act="google"><img src="images/google.jpg" alt="">Continue with Google</button>
    <a class="link" href="#/register">New to AgriRenta? Create an account</a>`),

  register: () => authCard(`<h1 style="text-align:center;">Create account</h1><p style="text-align:center;">Pick how you will use AgriRenta.</p>
    <div class="chips"><button class="chip ${regRole === "customer" ? "on" : ""}" data-act="role" data-v="customer">Customer</button><button class="chip ${regRole === "owner" ? "on" : ""}" data-act="role" data-v="owner">Equipment owner</button></div>
    <small>Admins join by invitation only.</small>
    <form data-form="register"><label>Full name</label><input name="name" placeholder="Enter your full name" required>
    <label>Email address</label><input name="email" type="email" placeholder="you@example.com" required>
    <label>Mobile number</label><input name="phone" placeholder="09XX XXX XXXX" required>
    <label>Password</label><input name="pw" type="password" minlength="8" placeholder="Create a strong password" required>
    <label>Confirm password</label><input name="pw2" type="password" placeholder="Re-enter your password" required>
    <label class="check"><input type="checkbox" required> I agree to the Terms of Service and Privacy Policy</label>
    <button class="btn btn-primary btn-block">Create Account</button></form>
    <p style="text-align:center;margin:.8rem 0 0">or continue with</p>
    <button class="btn btn-soft btn-block google-login" data-act="google"><img src="images/google.jpg" alt="">Continue with Google</button>
    <a class="link" href="#/login">Already registered? Log in</a><p style="text-align:center;margin-top:.8rem"><span class="pill">Next: verify your mobile number and ID</span></p>`),

  "choose-role": () => authCard(`<h1 style="text-align:center;">Welcome to AgriRenta</h1><p style="text-align:center;">Pick how you will use AgriRenta.</p>
    <div class="chips"><button class="chip ${regRole === "customer" ? "on" : ""}" data-act="role" data-v="customer">Customer</button><button class="chip ${regRole === "owner" ? "on" : ""}" data-act="role" data-v="owner">Equipment owner</button></div>
    <small>Admins join by invitation only.</small>
    <button class="btn btn-primary btn-block" data-act="setrole">Continue</button>`),

  "verify-mobile": () => authCard(`<h1 style="text-align:center;">Verify your mobile</h1><p>We sent a 6-digit code to <b>${escapeHtml(me()?.phone || "your account")}</b>. For this demo, enter any six digits.</p>
    <form data-form="otp"><div class="otp">${"<input inputmode='numeric' maxlength='1' required>".repeat(6)}</div>
    <button class="btn btn-primary btn-block">Verify mobile</button></form><button class="btn btn-soft btn-block" type="button" data-act="verifylater">Verify later</button><a class="link" href="#" data-act="resend">Resend code</a>`),

  "verify-id": () => authCard(`<h1 style="text-align:center;">Verify your ID</h1><p>Step 2 of 3 · Government ID and selfie</p>
    <div class="chips">${["PhilSys ID", "UMID", "Driver's", "Passport"].map((t) => `<button class="chip ${t === idType ? "on" : ""}" data-act="idtype" data-v="${t}">${t}</button>`).join("")}</div>
    <form data-form="id"><label>ID front</label><input type="file" accept="image/*" required><label>ID back</label><input type="file" accept="image/*" required>
    <label>Selfie check (hold your phone at eye level, good light)</label><input type="file" accept="image/*" capture="user" required>
    <p style="margin-top:.8rem">Your photos are submitted for review and can be viewed by you and authorized AgriRenta administrators.</p>
    <button class="btn btn-primary btn-block">Submit for review</button></form><button class="btn btn-soft btn-block" type="button" data-act="verifylater">Verify Later</button>`),

  explore: () => [`<div class="head"><div><h1>Explore equipment</h1><p>Find the right machine for your farm.</p></div><span class="pill">${db.eq.filter(e=>(!e.status||e.status==="approved")&&e.visible!==false).length} listings</span></div>
    <input id="q" class="searchbar" placeholder="Search equipment, type, or location..." value="${q}">${chips()}
    <div class="filter-row"><label>Maximum daily price <input id="maxPrice" type="number" min="0" placeholder="Any price" value="${maxPrice}"></label><label>Sort by <select id="sortBy"><option value="recommended" ${sortBy === "recommended" ? "selected" : ""}>Recommended</option><option value="price-low" ${sortBy === "price-low" ? "selected" : ""}>Price: low to high</option><option value="price-high" ${sortBy === "price-high" ? "selected" : ""}>Price: high to low</option><option value="rating" ${sortBy === "rating" ? "selected" : ""}>Top rated</option><option value="saved" ${sortBy === "saved" ? "selected" : ""}>Saved equipment</option></select></label></div>
    <div class="grid" id="list">${list()}</div>`, "app"],

  equipment: (id, u) => { const e = E(id); if (!e) return V.explore(); const o = usr(e.owner), r = avg(e.owner), own = !!u && u.role === "owner" && e.owner === u.email, isAdmin = u?.role === "admin";
    if (e.visible === false && !own && u?.role !== "admin") return [`<a href="#/explore">← Back</a><section class="neu"><h2>Listing unavailable</h2><p>The owner has hidden this equipment from customers.</p></section>`, "app"];
    const today = dateKey(new Date()); const todayUnavailable = dayStatus(e.id, today);
    if (e.status && e.status !== "approved" && !own && !isAdmin) return [`<a href="#/explore">← Back</a><section class="neu"><h2>Equipment under review</h2><p>This listing will appear to customers after AgriRenta approves the equipment details and papers.</p></section>`, "app"];
    const backHref = own ? "#/listings" : isAdmin ? `#/user/${encodeURIComponent(e.owner)}` : "#/explore";
    return [`<a href="${backHref}">← Back</a><div class="grid equipment-detail-layout" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))"><div><img class="hero-img neu" src="${img(e.img)}" alt="${e.name}"></div>
    <div><button class="pill status-button ${todayUnavailable?'warn':''}" type="button" disabled>${todayUnavailable?'Unavailable / booked':'Available'} ${todayUnavailable?'×':'✓'}</button> ${badge(o)}<h1>${e.name} · ${e.spec}</h1><p>Reliable power for everyday field work. Suitable for plowing, hauling and general farm operations.</p>
    <p class="equipment-location"><i class="bi bi-geo-alt-fill"></i> ${locationText(e)}</p><div class="row"><b class="price" style="font-size:2rem">${peso(e.price)} / day</b><span>${stars(e.rating)} <b>${e.rating}</b> (${e.n})</span></div>
    ${own ? `<section class="neu owner-edit-panel"><h3>Customer visibility</h3><p>${e.visible === false ? "Hidden from customers." : "Visible to customers after approval."}</p><button class="btn btn-soft" type="button" data-act="visibility" data-v="${e.id}">${e.visible === false ? "Make visible to customers" : "Hide from customers"}</button><h3 style="margin-top:1rem">Listing location</h3><form data-form="updatelocation" class="stack"><input type="hidden" name="eq" value="${e.id}"><label>Location</label><input name="location" list="bunawanLocations" value="${e.location||''}" placeholder="Type your equipment location" required><datalist id="bunawanLocations">${LOCATIONS.map(l=>`<option value="${l}"></option>`).join('')}</datalist><button class="btn btn-primary">Save location</button></form><h3>Equipment availability</h3><p class="muted">Tap a future date to mark it unavailable or available. Booked dates cannot be changed here.</p><div class="owner-calendar">${calendarDays(e.id,30,false)}</div><div class="availability-legend"><span><i class="available-dot"></i> Available</span><span><i class="unavailable-dot"></i> Unavailable / booked</span></div></section>` : `<div class="neu" style="margin:1.2rem 0"><small>Provided by</small><a class="owner-profile-card" href="#/owner/${encodeURIComponent(e.owner)}">${avatar(o)}<span><b>${escapeHtml(o.name)}</b><small>${r ? r.v.toFixed(1) + " · " + r.n + " reviews" : "New owner"} · ${isVerified(o) ? "ID verified" : "Verification pending"}</small></span></a></div>${isAdmin ? `<p class="muted">Admin listing view · Status: ${escapeHtml(e.status || "approved")} · ${e.visible === false ? "Hidden from customers" : "Visible to customers"}</p>` : `<div class="equipment-actions"><a class="btn btn-primary" href="#/book/${e.id}">Book Now</a><a class="floating-message" href="#/messages/${encodeURIComponent(e.owner)}" aria-label="Message equipment owner" title="Message equipment owner"><i class="bi bi-chat-dots-fill" aria-hidden="true"></i></a></div>`}`}</div></div>
    ${!own ? `<section class="neu availability-panel"><div class="row"><h3>Equipment availability</h3><span class="pill">Next 14 days</span></div><p class="muted">Choose dates that are not blocked by the owner or reserved by another customer.</p><div class="availability-days">${Array.from({length:14},(_,i)=>{const dt=new Date();dt.setHours(12,0,0,0);dt.setDate(dt.getDate()+i);const day=dateKey(dt);const unavailable=dayStatus(e.id,day);return `<span class="availability-day ${unavailable?'unavailable':'available'}"><b>${dt.toLocaleDateString('en-US',{weekday:'short'})}</b><strong>${dt.getDate()}</strong><small>${unavailable?'Unavailable / booked':'Available'}</small></span>`}).join('')}</div><div class="availability-legend"><span><i class="available-dot"></i> Available</span><span><i class="unavailable-dot"></i> Unavailable / booked</span></div></section>` : ''}`, "app"]; },

  book: (id, u) => { const e = E(id); if (!e || (e.status && e.status !== "approved") || e.visible === false) return V.explore(); draft = draft && draft.eq == id ? draft : { eq: id, start: "", end: "", delivery: "Delivery", addr: "", pay: "Cash on Delivery (COD)" };
    const today = dateKey(new Date());
    return [`<a href="#/equipment/${id}">← Back</a><h1>Book equipment</h1><p>Review your rental details. ${badge(u)}</p>
    <div class="neu item"><img src="${img(e.img)}" alt="" style="width:90px;height:70px;object-fit:cover;border-radius:14px"><div><h3>${e.name} · ${e.spec}</h3><p class="equipment-location"><i class="bi bi-geo-alt-fill"></i> ${locationText(e)}</p><b class="price">${peso(e.price)} / day</b></div></div>
    <section class="neu availability-panel"><div class="row"><h3>Equipment availability</h3><span class="pill">Next 14 days</span></div><p class="muted">Choose dates that are not blocked by the owner or reserved by another customer.</p><div class="availability-days">${Array.from({length:14},(_,i)=>{const dt=new Date();dt.setHours(0,0,0,0);dt.setDate(dt.getDate()+i);const day=dateKey(dt);const unavailable=dayStatus(e.id,day);return `<span class="availability-day ${unavailable?'unavailable':'available'}"><b>${dt.toLocaleDateString('en-US',{weekday:'short'})}</b><strong>${dt.getDate()}</strong><small>${unavailable?'Unavailable / booked':'Available'}</small></span>`}).join('')}</div><div class="availability-legend"><span><i class="available-dot"></i> Available</span><span><i class="unavailable-dot"></i> Unavailable / booked</span></div></section>
    <form data-form="book" class="stack"><div class="days"><div><label>Start date</label><input type="date" name="start" min="${today}" value="${draft.start}" required></div><div><label>End date</label><input type="date" name="end" min="${today}" value="${draft.end}" required></div></div>
    <div class="days"><label class="neu opt"><input type="radio" name="delivery" value="Delivery" ${draft.delivery === "Delivery" ? "checked" : ""}><span><b>Delivery</b><br><small>To your farm</small></span></label>
    <label class="neu opt"><input type="radio" name="delivery" value="Pickup" ${draft.delivery === "Pickup" ? "checked" : ""}><span><b>Pickup</b><br><small>Collect yourself</small></span></label></div>
    <div><label>Farm / delivery address</label><input name="addr" placeholder="Enter complete address" value="${draft.addr}"></div>
    <div class="neu sum"><h3>Price summary</h3><div><span>Rental fee (1 day)</span><b>${peso(e.price)}</b></div><div><span>Delivery fee</span><small>Calculated at checkout</small></div><div class="tot"><span>Estimated total</span><span>${peso(e.price)}+</span></div></div>
    <button class="btn btn-primary">Continue</button></form>`, "app"]; },

  confirm: (id) => { const e = E(id); if (!e || !draft || !draft.start) return V.explore(); const d = Math.max(1, Math.round((new Date(draft.end) - new Date(draft.start)) / 864e5));
    return [`<a href="#/book/${id}">← Back</a><h1>Confirm booking</h1><p>One last look before you submit.</p>
    <div class="neu item"><img src="${img(e.img)}" alt="" style="width:90px;height:70px;object-fit:cover;border-radius:14px"><div><h3>${e.name}</h3><p>${fmt(draft.start)} – ${fmt(draft.end)} · ${d} day rental</p>${pill("request")}</div></div>
    <form data-form="confirm" class="stack"><h3>Payment method</h3>
    <div class="payment-options">
      <label class="payment-option"><input type="radio" name="pay" value="GCash" required><img class="payment-logo" src="images/gcash.png.svg" alt="GCash logo"><span><b>GCash</b><br><small>Pay using GCash</small></span></label>
      <label class="payment-option"><input type="radio" name="pay" value="Cash on Delivery (COD)"><span class="payment-logo" aria-hidden="true" style="display:grid;place-items:center;color:#176b37;font-weight:900">COD</span><span><b>Cash on Delivery</b><br><small>Pay when the rental is delivered / collected</small></span></label>
    </div>
    <section id="onlinePaymentDetails" class="neu payment-details" hidden aria-live="polite">
      <h3 id="paymentFormTitle">Payment instructions</h3>
      <p id="paymentFormHint">Choose a payment method to see the next step.</p>
      <div id="paymentMethodMessage" class="payment-method-message"></div>
      <p class="payment-note"><i class="bi bi-shield-lock" aria-hidden="true"></i> Never enter your wallet PIN, password, or OTP on AgriRenta. Online payments open the provider's secure checkout. Your booking and equipment details remain unchanged if you switch payment methods before submitting.</p>
    </section>
    <div class="neu sum"><h3>Cost breakdown</h3><div><span>Rental fee</span><b>${peso(e.price * d)}</b></div><div><span>Deposit (if required)</span><small>To be confirmed</small></div><div><span>Delivery</span><small>Calculated separately</small></div><div class="tot"><span>Total estimate</span><span>${peso(e.price * d)}+</span></div></div>
    <label class="check"><input type="checkbox" name="termsAccepted" value="yes" required> I have reviewed the rental terms.</label><button class="btn btn-primary">Submit Rental Request</button></form>`, "app"]; },

  submitted: (ref) => { const bookingRef = decodeURIComponent(ref || ""); const b = db.bookings.find((x) => x.ref === bookingRef); if (!b) return V.bookings(null, me()); const e = bookingEquipment(b);
    return [`<div class="neu" style="max-width:520px;margin:2rem auto;text-align:center"><div class="ico" style="width:80px;height:80px;margin:0 auto 1rem;background:linear-gradient(135deg,var(--g1),var(--g2));color:#fff;font-size:2rem">✓</div>
    <h1>Rental details</h1><p>${b.status === "pending" ? "Your rental request is waiting for the equipment owner." : "Booking reference and rental status."}</p><div class="neu inset" style="text-align:left"><small>BOOKING REFERENCE</small><div class="row"><h2>${escapeHtml(b.ref)}</h2>${pill(b.status || "pending")}</div>
    <b>${escapeHtml(e.name)} · ${escapeHtml(e.spec)}</b><p>${fmt(b.start)} – ${fmt(b.end)}</p><div class="row"><span>Estimated rental fee</span><b class="price">${peso(b.total)}+</b></div><div class="row"><span>Payment method</span><b>${escapeHtml(b.pay || "Not selected")}</b></div><div class="row"><span>Payment status</span><b>${escapeHtml(String(b.paymentStatus || "pending").replaceAll("_"," "))}</b></div><p><a href="#/equipment/${e.id}">View equipment</a> · <a href="#/owner/${encodeURIComponent(b.owner)}">View equipment owner</a></p><small>The owner sees your ID badge and star rating before approving.</small></div>
    <p style="margin-top:1rem"><b>What happens next?</b> ${b.pay === "Cash on Delivery (COD)" ? "The owner will review the request. Pay when the rental is delivered or collected, then the owner/admin should record payment received." : b.pay === "GCash" ? "This was a GCash checkout demonstration only; no real payment was processed. The owner will review your rental request." : "The equipment owner will review your booking request."}</p>
    <a class="btn btn-primary btn-block" href="#/bookings">View My Bookings</a><a class="btn btn-soft btn-block" href="#/home">Back to Home</a></div>`, "app"]; },

  home: (a, u) => { const f = db.eq.find(e=>(!e.status||e.status==="approved") && e.visible !== false) || db.eq[0], steps = [!!u.phone && u.v.mobile, u.v.email, u.v.id === "ok", u.v.selfie === "ok"].filter(Boolean).length;
    const hr = new Date().getHours(), hi = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
    return [`<header class="hello"><a href="index.html" class="hello-logo"><img src="logo.png" alt="AgriRenta"></a><div class="hello-copy"><small class="role-kicker">${roleLabel(u)}</small><h1>${hi}, ${u.name.split(" ")[0]}</h1><p>Ready to get work done?</p></div><a class="header-profile" href="#/profile" aria-label="Open profile">${avatar(u)}</a></header>
    <input id="q" class="searchbar" placeholder="Search equipment or location..." value="${q}" onkeydown="if(event.key==='Enter'){q=this.value.trim();cat='All types';go('#/explore')}">
    <h2 style="margin-top:1.4rem">Browse categories</h2><div class="category-grid">${["Tractors", "Harvesters", "Tillers"].map((c) => `<a class="category-card" href="#/explore" data-act="cat" data-v="${c}"><img src="${categoryImage[c]}" alt="${c}"><span>${c}</span></a>`).join("")}<a class="category-card category-more" href="#/explore" data-act="cat" data-v="All types"><span class="category-more-icon"><i class="bi bi-three-dots" aria-hidden="true"></i></span><span>See More</span></a></div>
    <div class="sec-head"><h2>Featured equipment</h2><a href="#/explore">See all</a></div><a href="#/equipment/${f.id}" class="promo"><video autoplay muted loop playsinline preload="metadata" poster="images/banner.png" aria-label="Featured farm equipment banner"><source src="bannercustomer.mp4" type="video/mp4"></video></a>
    ${isVerified(u) ? "" : `<a href="#/verification" class="neu item card" style="margin-top:1.4rem;background:linear-gradient(135deg,var(--g1),var(--g2));color:#fff"><div><small style="color:#d6efdf">COMPLETE YOUR PROFILE</small><h3>Verify your ID to book faster</h3><div class="bar"><i style="width:${steps * 25}%"></i></div><small style="color:#d6efdf">${steps} of 4 steps</small></div></a>`}
    <div class="sec-head"><h2>All equipment</h2><a href="#/explore">Explore all</a></div><div class="grid" id="homeEquipmentList">${filteredAvailableEquipment(q).map(eqCard).join("") || "<p>No equipment matches your search. Try another name, type, or location.</p>"}</div>`, "app"]; },

  bookings: (a, u) => { const mine = db.bookings.filter((b) => b.renter === u.email), f = a || "all";
    const show = mine.filter((b) => f === "all" || (f === "pending" && b.status === "pending") || (f === "active" && b.status === "approved") || (f === "history" && ["returned", "declined"].includes(b.status)));
    return [`<h1>My bookings</h1><p>Keep track of your equipment rentals.</p><div class="chips">${["all", "pending", "active", "history"].map((t) => `<a class="chip ${t === f ? "on" : ""}" href="#/bookings/${t}">${t[0].toUpperCase() + t.slice(1)}</a>`).join("")}</div>
    <div class="stack">${show.map((b) => { const e = bookingEquipment(b); return `<div class="neu item booking-item"><a class="booking-equipment-link" href="#/equipment/${e.id}" aria-label="View ${e.name} equipment details"><img src="${img(e.img)}" alt="${e.name}" style="width:90px;height:70px;object-fit:cover;border-radius:14px"><div><h3>${e.name}</h3><p>${b.ref}</p></div></a><div class="booking-status-actions">${b.status === "returned" ? `<a class="btn btn-soft btn-sm" href="#/submitted/${encodeURIComponent(b.ref)}">View</a>` : pill(b.status)} ${b.status === "returned" && !b.ratedOwner ? `<a class="btn btn-primary btn-sm" href="#/rate/${encodeURIComponent(b.ref)}">★ Rate owner</a>` : ""} ${b.status === "pending" ? `<button class="btn btn-soft btn-sm btn-danger" data-act="cancel" data-v="${b.ref}">Cancel</button>` : ""}</div><div class="booking-dates-payment"><p>${fmt(b.start)} – ${fmt(b.end)}</p><small>${b.pay || "Payment method not set"} · ${String(b.paymentStatus || "pending").replaceAll("_"," ")}</small><b class="price">${peso(b.total)}</b><a class="btn btn-soft btn-sm" href="#/submitted/${encodeURIComponent(b.ref)}">${b.status === "pending" ? "View your rent" : "View rental"}</a></div></div>`; }).join("") || "<p>No bookings here yet.</p>"}</div>
    <div class="neu"><h3>Need another machine?</h3><p>Explore equipment available for your farm.</p><a href="#/explore"><b>Browse equipment</b></a></div>`, "app"]; },

  alerts: (a, u) => { const rows = notificationRecords(u), reads = new Set(db.notificationReads[u.email] || []);
    return [`<h1>Notifications</h1><p>Unread notifications: <b>${rows.filter(item => !reads.has(item.id)).length}</b>. Select the red dot to mark one as read.</p><div class="stack">${rows.map(item => `<article class="neu item notification-row ${reads.has(item.id) ? "is-read" : ""}"><button type="button" class="notification-read ${reads.has(item.id) ? "read" : ""}" data-act="marknotification" data-v="${encodeURIComponent(item.id)}" aria-label="${reads.has(item.id) ? "Notification read" : "Mark notification as read"}" title="${reads.has(item.id) ? "Read" : "Mark as read"}"></button><a class="notification-content" href="${item.href}"><b>${escapeHtml(item.title)}</b><p>${escapeHtml(item.description)}</p><small>${item.time ? new Date(item.time).toLocaleString() : ""}</small></a></article>`).join("") || "<p>No notifications yet.</p>"}</div>`, "app"]; },

  rate: (ref, u) => { const b = db.bookings.find((x) => x.ref === ref); if (!b) return V.bookings(null, u); const owner = u.role === "owner", t = usr(owner ? b.renter : b.owner);
    const tags = owner ? ["Returned on time", "Careful with equipment", "Good communication", "Paid on time", "Followed instructions"] : ["On time", "Clean equipment", "Good condition", "Friendly owner", "Fair price", "Easy pickup"];
    return [`<a href="#/${owner ? "dashboard" : "bookings"}">← Back</a><h1>Rate your ${owner ? "renter" : "rental"}</h1><p>Only verified users can leave ratings.</p>
    ${isVerified(u) ? "" : `<div class="neu"><b>Verify your ID first.</b> <a href="#/verification"><b>Open verification center</b></a></div>`}
    <div class="neu" style="text-align:center"><p>How was ${t.name}?</p><div class="starpick" style="justify-content:center">${[1, 2, 3, 4, 5].map((n) => `<button class="${n <= rate.stars ? "on" : ""}" data-act="star" data-v="${n}">★</button>`).join("")}</div><b>${["", "Poor", "Fair", "Good", "Great", "Excellent"][rate.stars]}</b></div>
    <h3 style="margin-top:1rem">What went well?</h3><div class="chips">${tags.map((x) => `<button class="chip ${rate.tags.includes(x) ? "on" : ""}" data-act="tag" data-v="${x}">${x}</button>`).join("")}</div>
    <form data-form="review" data-ref="${ref}"><textarea name="text" rows="3" placeholder="Share more about your experience (optional)"></textarea><button class="btn btn-primary btn-block">Submit review</button></form>`, "app"]; },

  verification: (a, u) => {
    if (u.role === "admin") return [`<a href="#/profile">← Back to account</a><h1>Admin account</h1><section class="neu"><p>Admin accounts do not use the customer and equipment-owner identity verification checklist.</p><a class="btn btn-primary" href="#/admin">Open admin overview</a></section>`, "app"];
    const v = u.v, own = u.role === "owner";
    const rows = [["<i class=\"bi bi-phone\" aria-hidden=\"true\"></i>", "Mobile number", u.phone || "Not provided", u.phone && v.mobile ? "ok" : "none", u.phone ? "#/verify-mobile" : "#/personal"], ["<i class=\"bi bi-envelope\" aria-hidden=\"true\"></i>", "Email address", u.email, v.email ? "ok" : "none", "#/personal"], ["<i class=\"bi bi-person-vcard\" aria-hidden=\"true\"></i>", "Government ID", "PhilSys, UMID, license or passport", v.id || "none", "#/verify-id"], ["<i class=\"bi bi-camera\" aria-hidden=\"true\"></i>", "Selfie match", "Matches your face to your ID", v.selfie || "none", "#/verify-id"]];
    if (own) rows.push(["<i class=\"bi bi-file-earmark-text\" aria-hidden=\"true\"></i>", "Equipment papers", "OR/CR and photos for your listings", v.papers || "none", "#/papers"]);
    const pct = Math.round(rows.filter((r) => r[3] === "ok").length / rows.length * 100);
    return [`<a href="#/profile">← Back</a><h1>Verification center</h1><p>Every user type has its own checklist.</p>
    <div class="neu item"><div class="ring" style="--p:${pct}"><b>${pct}%</b></div><div><small>TRUST LEVEL</small><h2>${isVerified(u) ? (own ? "Verified owner" : "Verified renter") : (own ? "Basic owner" : "Basic renter")}</h2><p>${isVerified(u) ? "Your profile shows an ID verified badge." : "Ratings unlock after verification."}</p></div></div>
    <div class="stack">${rows.map((r) => `<div class="neu item"><span class="ico">${r[0]}</span><div><b>${r[1]}</b><p>${r[2]}</p></div>${r[3] === "ok" ? `<span class="pill">✓ Done</span>` : r[3] === "review" ? `<span class="pill warn">in review</span><a class="btn btn-soft btn-sm" href="${r[4]}">Edit / Resubmit</a>` : `<a class="btn btn-primary btn-sm" href="${r[4]}">Start verification</a>`}</div>`).join("")}</div>
    <p>Verified profiles get a badge and star ratings.</p>`, "app"]; },

  profile: (a, u) => { const r = avg(u.email);
    return [`<h1>My account</h1><p>Manage your account details and preferences.</p><div class="neu item profile-summary">${avatar(u, "avatar-large")}<div><small class="role-kicker-dark">${roleLabel(u)}</small><h2>${u.name}</h2><p>${u.email}</p>${u.role !== "admin" ? badge(u) : `<span class="pill">2FA on</span>`}</div></div>
    <div class="stack"><small>ACCOUNT</small><a class="neu item card" href="#/personal"><div><b>Personal information</b><p>Update your details</p></div>›</a>
    <a class="neu item card" href="#/verification"><div><b>Verification center</b><p>Check your steps</p></div>›</a><a class="neu item card" href="#/alerts"><div><b>Notifications</b><p>Unread account, message, and system activity</p></div>›</a>
    <a class="neu item card" href="#/messages"><div><b>Messages</b><p>${u.role === "admin" ? "View user messages and admin ratings" : "Message AgriRenta admin support"}</p></div>›</a>
    ${u.role !== "admin" ? `<a href="#/reviews" class="neu item card"><div><span style="font-family:var(--fh);font-size:2.5rem">${r ? r.v.toFixed(1) : "–"}</span> ${stars(r ? r.v : 0)}<p>${r ? r.n + " reviews" : "No reviews yet"}</p></div>›</a>` : ""}
    <button class="btn btn-soft btn-danger" data-act="logout">Log Out</button></div>`, "app"]; },

  personal: (a, u) => { return [`<a href="#/profile">← Back to account</a><h1>Personal information</h1><p>Update your contact and account details.</p>
    <div class="neu item profile-summary">${avatar(u, "avatar-large")}<div><small class="role-kicker-dark">${roleLabel(u)}</small><h2>${u.name}</h2><p>${u.email}</p></div></div>
    <form data-form="personal" class="neu stack"><h3>Personal information</h3><label>Full name</label><input name="name" value="${u.name}" required><label>Email address</label><input name="email" type="email" value="${u.email}" required><label>Mobile number</label><input name="phone" type="tel" value="${u.phone || ''}" required><label>Address</label><input name="address" value="${u.address || ''}" placeholder="Barangay, municipality, province"><button class="btn btn-primary">Save personal information</button></form>
    <form data-form="password" class="neu stack"><h3>Change password</h3><label>Current password</label><input type="password" name="currentPassword" required autocomplete="current-password"><label>New password</label><input type="password" name="newPassword" minlength="8" required autocomplete="new-password"><label>Confirm new password</label><input type="password" name="confirmPassword" minlength="8" required autocomplete="new-password"><button class="btn btn-soft">Update password</button></form>
    <form data-form="avatar" class="neu stack"><h3>Profile picture</h3><p>Choose a photo to save to your AgriRenta profile so other users can recognize your account. Photos are automatically optimized for storage.</p><label>Upload profile picture</label><input type="file" name="avatar" accept="image/*" required><button class="btn btn-primary">Save profile picture</button></form>`, "app"]; },

  messages: (a, u) => {
    const admin = u.role === "admin";
    const decodeArg = a ? decodeURIComponent(a) : "";
    const directKey = (email) => "direct:" + [u.email, email].sort().join("|");
    const directContacts = db.users.filter(x => x.role !== "admin" && x.email !== u.email
      && (admin || (u.role === "customer" ? x.role === "owner" : x.role === "customer")));
    const adminThreads = [...new Set([...db.users.filter(x => x.role !== "admin").map(x => x.email), ...db.messages.map(threadOf).filter(t => !String(t).startsWith("direct:"))])];
    let selected;
    if (admin) selected = decodeArg || adminThreads[0] || "";
    else if (decodeArg && db.users.some(x => x.email === decodeArg && x.email !== u.email && x.role !== "admin")) selected = directKey(decodeArg);
    else selected = decodeArg.startsWith("direct:") && decodeArg.split("|").includes(u.email) ? decodeArg : u.email;
    const directEmails = selected.startsWith("direct:") ? selected.slice(7).split("|") : [];
    const otherEmail = directEmails.find(em => em !== u.email) || (selected !== u.email ? selected : "");
    const other = usr(otherEmail);
    const rows = db.messages.filter(m => threadOf(m) === selected).sort((x,y) => new Date(x.time)-new Date(y.time));
    const threadLabel = (thread) => { if (thread.startsWith("direct:")) { const pair = thread.slice(7).split("|"); const peer = pair.find(em => em !== u.email) || pair[0]; return usr(peer).name + " · " + roleLabel(usr(peer)); } return usr(thread).name || "AgriRenta Admin Support"; };
    const target = selected.startsWith("direct:") ? selected : (admin ? selected : u.email);
    const contactRow = (person, thread, subtitle) => `<div class="messenger-contact-row" data-chat-contact data-search="${escapeHtml([person.name, person.email, person.role, person.phone].join(" "))}">
      <a class="messenger-avatar-link" href="${profileHref(person.email, u)}" aria-label="View ${escapeHtml(person.name)} profile">${avatar(person)}</a>
      <a class="messenger-contact ${selected === thread ? "on" : ""}" href="#/messages/${encodeURIComponent(person.email)}"><span><b>${escapeHtml(person.name)}</b><small>${escapeHtml(subtitle)}</small></span></a></div>`;
    const contactRows = admin
      ? adminThreads.map(email => contactRow(usr(email), email, `${roleLabel(usr(email))} · Support`)).join("")
      : directContacts.map(person => contactRow(person, directKey(person.email), roleLabel(person))).join("");
    const supportActive = !admin && selected === u.email;
    const headerPerson = selected.startsWith("direct:") ? other : (admin ? usr(selected) : { name: "AgriRenta Admin Support", role: "admin", avatar: "" });
    const headerProfile = selected.startsWith("direct:") ? profileHref(otherEmail, u) : admin ? profileHref(selected, u) : "";
    return [`<div class="head"><div><h1><i class="bi bi-chat-dots"></i> Messages</h1><p>${admin ? "Read and reply to customer and equipment owner conversations." : "Contact the equipment owner or send concerns and suggestions to AgriRenta admin."}</p></div></div>
    <div class="messenger-layout"><aside class="neu messenger-contacts"><div class="messenger-contacts-title">Chats</div><label class="sr-only" for="chatSearch">Search users in chats</label><input id="chatSearch" class="chat-search" type="search" placeholder="Search by name..." autocomplete="off">${!admin ? `<div class="messenger-section-label">${u.role === "customer" ? "Equipment owners" : "Customers"}</div><div class="messenger-contact-list">${contactRows || '<p class="empty-state">No users available yet.</p>'}</div><div class="messenger-section-label">Support</div><a class="messenger-contact ${supportActive ? "on" : ""}" href="#/messages">${avatar({name:"AgriRenta Admin Support",role:"admin"})}<span><b>Admin support</b><small>Private conversation with AgriRenta</small></span></a>` : `<div class="messenger-section-label">Customer & owner support</div><div class="messenger-contact-list">${contactRows || '<p class="empty-state">No users available yet.</p>'}</div>`}</aside>
    <section class="neu message-thread"><div class="message-thread-head">${headerProfile ? `<a class="messenger-avatar-link" href="${headerProfile}" aria-label="View ${escapeHtml(headerPerson.name)} profile">${avatar(headerPerson)}</a>` : avatar(headerPerson)}<span><b>${escapeHtml(selected.startsWith("direct:") ? other.name : (admin ? threadLabel(selected) : "AgriRenta Admin Support"))}</b><small>${selected.startsWith("direct:") ? roleLabel(other) : (admin ? roleLabel(usr(selected)) : "Admin support")}</small></span></div><div class="message-list">${rows.map(m => `<article class="message-bubble ${m.author === u.email ? "mine" : ""}"><small>${m.author === u.email ? "You" : (admin || selected.startsWith("direct:") ? escapeHtml(usr(m.author).name) : "AgriRenta Admin")} · ${new Date(m.time).toLocaleString()}</small><p>${escapeHtml(m.text)}</p></article>`).join("") || `<p class="empty-state">No messages yet. Send the first message below.</p>`}</div>
    <form data-form="message" data-to="${target}" class="message-compose"><label>Message</label><textarea name="text" rows="3" maxlength="2000" placeholder="Write your message..." required></textarea><button class="btn btn-primary"><i class="bi bi-send"></i> Send message</button></form></section></div>
    ${admin ? (() => { const ar = db.reviews.filter(x => x.type === "admin" && x.to === u.email); const average = ar.length ? ar.reduce((sum,x)=>sum+x.stars,0)/ar.length : 0; return `<section class="neu" style="margin-top:1rem"><h2>Admin support ratings</h2><p>${ar.length ? `${average.toFixed(1)} out of 5 · ${ar.length} rating(s)` : "No admin ratings yet."}</p>${ar.map(x=>`<div class="neu item"><div><b>${usr(x.from).name}</b><p>${stars(x.stars)} ${x.stars}/5</p><p>${String(x.text||"")}</p><small>${x.date||""}</small></div></div>`).join("")}</section>`; })() : (!selected.startsWith("direct:") ? `<section class="neu admin-rating" style="margin-top:1rem"><h3>Rate AgriRenta Admin Support</h3><p>How helpful was our admin team?</p><div class="starpick" aria-label="Select a rating">${[1,2,3,4,5].map(n=>`<button type="button" class="${n <= (db.reviews.find(x=>x.type === "admin" && x.from === u.email)?.stars || rate.stars) ? "on" : ""}" data-act="adminstar" data-v="${n}" aria-label="${n} star${n===1?"":"s"}">★</button>`).join("")}</div><b>${db.reviews.find(x=>x.type === "admin" && x.from === u.email) ? "Update your rating" : "Your rating helps us improve"}</b><form data-form="adminrating" class="stack"><textarea name="text" rows="2" maxlength="1000" placeholder="Optional feedback about admin support">${String(db.reviews.find(x=>x.type === "admin" && x.from === u.email)?.text || "")}</textarea><button class="btn btn-primary">${db.reviews.find(x=>x.type === "admin" && x.from === u.email) ? "Update admin rating" : "Submit admin rating"}</button></form></section>` : "")}`, "app"];
  },
  owner: (emailArg, u) => { const email = emailArg ? decodeURIComponent(emailArg) : ""; const owner = usr(email); if (!email || owner.role !== "owner") return V.explore(); const ownProfile = u?.email === email; const rs = db.reviews.filter(x => x.to === email && x.type !== "admin"); const r = avg(email); return [`<a href="#/explore">← Back to equipment</a><div class="neu item profile-summary">${avatar(owner, "avatar-large")}<div><small class="role-kicker-dark">Equipment Owner</small><h1>${escapeHtml(owner.name)}</h1><p>${ownProfile ? escapeHtml(owner.email) : "AgriRenta member"}</p>${badge(owner)}<p>${r ? stars(r.v) + " " + r.v.toFixed(1) + " · " + r.n + " reviews" : "No customer reviews yet"}</p></div></div>${ownerListingPanel(email, ownProfile)}<h2>Customer reviews</h2><div class="stack">${rs.map(x => `<div class="neu"><div class="row"><b><a href="#/member/${encodeURIComponent(x.from)}">${avatar(usr(x.from))} ${escapeHtml(usr(x.from).name)}</a></b><small>${x.date || ""}</small></div>${stars(x.stars)}<p>${escapeHtml(x.text || "")}</p></div>`).join("") || "<p>No customer reviews yet.</p>"}</div>${ownProfile ? `<a class="btn btn-primary" href="#/listings">Manage my listings</a>` : `<a class="btn btn-primary" href="#/messages/${encodeURIComponent(email)}">Message owner</a>`}`, "app"]; },
  member: (emailArg, u) => { const email = emailArg ? decodeURIComponent(emailArg) : ""; const person = db.users.find(x => x.email === email && x.role !== "admin"); if (!person) return V.explore(); const r = avg(email); const rs = db.reviews.filter(x => x.to === email && x.type !== "admin"); const ownProfile = u?.email === email; return [`<a href="#/explore">← Back</a><div class="neu item profile-summary">${avatar(person, "avatar-large")}<div><small class="role-kicker-dark">${roleLabel(person)}</small><h1>${escapeHtml(person.name)}</h1><p>AgriRenta member</p>${badge(person)}<p>${r ? stars(r.v) + " " + r.v.toFixed(1) + " · " + r.n + " ratings" : "No ratings yet"}</p></div></div>${person.role === "owner" ? ownerListingPanel(email, ownProfile) : ""}<h2>Ratings and feedback</h2><div class="stack">${rs.map(x => `<div class="neu"><div class="row"><b><a href="#/member/${encodeURIComponent(x.from)}">${avatar(usr(x.from))} ${escapeHtml(usr(x.from).name)}</a></b><small>${x.date || ""}</small></div>${stars(x.stars)}<p>${escapeHtml(x.text || "")}</p></div>`).join("") || "<p>No ratings or feedback yet.</p>"}</div>${person.email !== db.me ? `<a class="btn btn-primary" href="#/messages/${encodeURIComponent(email)}">Message ${person.role === "owner" ? "owner" : "customer"}</a>` : person.role === "owner" ? `<a class="btn btn-primary" href="#/listings">Manage my listings</a>` : ""}`, "app"]; },
  user: (emailArg) => { const email = emailArg ? decodeURIComponent(emailArg) : ""; const person = db.users.find(x => x.email === email); if (!person) return [`<a href="#/users">← Back to users</a><p>User not found.</p>`, "app"]; const reviews = db.reviews.filter(x => x.to === email && x.type !== "admin"); const listings = db.eq.filter(x => x.owner === email); const docs = person.idDocs; return [`<a href="#/users">← Back to users</a><div class="neu item profile-summary">${avatar(person, "avatar-large")}<div><small class="role-kicker-dark">${roleLabel(person)}</small><h1>${escapeHtml(person.name)}</h1><p>${escapeHtml(person.email)}</p><p>Phone: ${escapeHtml(person.phone || "Not provided")} · Address: ${escapeHtml(person.address || "Not provided")}</p>${person.role === "admin" ? "" : badge(person)}<p>Government ID: ${escapeHtml(person.v?.id || "none")} · Selfie: ${escapeHtml(person.v?.selfie || "none")}</p></div></div>
    ${docs ? `<section class="neu"><h2>Identity documents · ${escapeHtml(docs.type || "Government ID")}</h2><p>Submitted ${docs.submittedAt ? new Date(docs.submittedAt).toLocaleString() : ""}</p>${idDocsHtml(person)}</section>` : `<section class="neu"><h2>Identity documents</h2><p>No ID images submitted.</p></section>`}
    ${person.v?.id === "review" ? `<button class="btn btn-primary btn-sm" data-act="vok" data-v="${escapeHtml(email)}|ID + selfie">Approve ID</button> <button class="btn btn-soft btn-sm btn-danger" data-act="vno" data-v="${escapeHtml(email)}|ID + selfie">Reject ID</button>` : ""}
    ${person.role === "owner" ? `<h2 style="margin-top:1rem">Owner equipment and documents</h2><div class="stack">${listings.map(item => `<section class="neu"><a class="admin-equipment-preview" href="#/equipment/${encodeURIComponent(item.id)}"><div class="item">${avatar(person)}<div><b>${escapeHtml(item.name)}</b><p>${escapeHtml(item.spec)} · ${peso(item.price)} / day · ${escapeHtml(item.location || "Location not set")}</p><p>Status: ${escapeHtml(item.status || "approved")} · ${item.visible === false ? "Hidden from customers" : "Visible to customers"}</p></div></div></a><div class="review-files"><div><b>Equipment photos · click to view listing</b><div class="review-thumbs">${(item.photos || []).map((photo,index) => `<a href="#/equipment/${encodeURIComponent(item.id)}" aria-label="View ${escapeHtml(item.name)} listing"><img src="${photo.data}" alt="Equipment photo ${index+1}"></a>`).join("") || (item.img ? `<a href="#/equipment/${encodeURIComponent(item.id)}" aria-label="View ${escapeHtml(item.name)} listing"><img src="${img(item.img)}" alt="${escapeHtml(item.name)}"></a>` : "<p>Not attached</p>")}</div></div><div class="review-docs"><b>OR/CR</b>${item.orcr ? `<a href="${item.orcr.data}" target="_blank" rel="noopener">${escapeHtml(item.orcr.name || "View OR/CR")}</a>` : "<p>Not attached</p>"}<b>Permit</b>${item.permit ? `<a href="${item.permit.data}" target="_blank" rel="noopener">${escapeHtml(item.permit.name || "View permit")}</a>` : "<p>Not provided</p>"}</div></div>${item.status === "review" ? `<button class="btn btn-primary btn-sm" data-act="eqapprove" data-v="${item.id}">Approve listing</button> <button class="btn btn-soft btn-sm btn-danger" data-act="eqreject" data-v="${item.id}">Reject listing</button>` : ""}</section>`).join("") || "<p>No owner listings.</p>"}</div>${person.v?.papers === "review" ? `<button class="btn btn-primary btn-sm" data-act="vok" data-v="${escapeHtml(email)}|Equipment papers">Approve equipment papers</button> <button class="btn btn-soft btn-sm btn-danger" data-act="vno" data-v="${escapeHtml(email)}|Equipment papers">Reject equipment papers</button>` : ""}` : ""}
    <h2 style="margin-top:1rem">Ratings and feedback</h2><div class="stack">${reviews.map(review => `<div class="neu"><div class="row"><b>${escapeHtml(usr(review.from).name)}</b><small>${escapeHtml(review.date || "")}</small></div>${stars(review.stars)}<p>${escapeHtml(review.text || "")}</p></div>`).join("") || "<p>No ratings or feedback yet.</p>"}</div>`, "app"]; },
  reviews: (a, u) => { const rs = db.reviews.filter((x) => x.to === u.email), r = avg(u.email);
    return [`<a href="#/profile">← Back</a><h1>Ratings & reviews</h1><div class="neu item"><div><span style="font-family:var(--fh);font-size:4rem">${r ? r.v.toFixed(1) : "–"}</span><br>${stars(r ? r.v : 0)}<p>${rs.length} reviews</p></div>
    <div>${[5, 4, 3, 2, 1].map((n) => { const c = rs.filter((x) => x.stars === n).length; return `<div class="row"><span>${n} ★</span><div class="bar"><i style="width:${rs.length ? c / rs.length * 100 : 0}%"></i></div><b>${c}</b></div>`; }).join("")}</div></div>
    <h2 style="margin-top:1.2rem">Recent reviews</h2><div class="stack">${rs.map((x) => `<div class="neu"><div class="row"><b>${usr(x.from).name}</b><small>${x.date}</small></div>${stars(x.stars)}<p>${x.text}</p></div>`).join("") || "<p>No reviews yet.</p>"}</div>`, "app"]; },

  /* owner */
  dashboard: (a, u) => { const reqs = db.bookings.filter((b) => b.owner === u.email), active = reqs.filter((b) => b.status === "approved").length, earn = reqs.filter((b) => b.status === "returned").reduce((s, b) => s + b.total * 0.9, 0), r = avg(u.email);
    const mineWithdrawals = db.withdrawals.filter(w=>w.owner===u.email), reserved = mineWithdrawals.filter(w=>["pending","approved"].includes(w.status)).reduce((s,w)=>s+Number(w.amount||0),0), paidOut=mineWithdrawals.filter(w=>w.status==="paid").reduce((s,w)=>s+Number(w.amount||0),0), balance=Math.max(0,earn-reserved-paidOut);
    return [`<header class="hello owner-hello"><a href="index.html" class="hello-logo"><img src="logo.png" alt="AgriRenta"></a><div class="hello-copy"><small class="role-kicker">Equipment Owner</small><h1>Owner dashboard</h1><p>Manage listings and rental requests.</p></div><a class="header-profile" href="#/profile" aria-label="Open profile">${avatar(u)}</a></header>
    <section class="platform-global-search"><label class="sr-only" for="ownerGlobalSearch">Search users, equipment, or locations</label><input id="ownerGlobalSearch" class="searchbar" type="search" placeholder="Search users, equipment, or locations..." autocomplete="off"><div id="ownerGlobalSearchResults">${platformSearchResults("", u)}</div></section>
    <div class="promo owner-banner"><video autoplay muted loop playsinline preload="metadata" poster="images/ownerbanner.png" aria-label="AgriRenta equipment owner banner"><source src="ownerbanner.mp4" type="video/mp4"></video></div>
    <div class="head"><div><h2>Owner portal</h2></div><span class="pill">${isVerified(u)?'ID verified owner':'Verification pending'}</span></div>
    <div class="grid stats"><a class="neu stat stat-link" href="#/listings"><b>${String(db.eq.filter((e) => e.owner === u.email && e.status !== 'rejected').length).padStart(2, "0")}</b>Equipment listed <small>Open my listings →</small></a><a class="neu stat stat-link" href="#/dashboard" data-act="jump" data-v="rental-requests"><b>${String(reqs.filter((b) => b.status === "pending").length).padStart(2, "0")}</b>Pending requests <small>Review requests →</small></a><a class="neu stat stat-link" href="#/dashboard" data-act="jump" data-v="rental-requests"><b>${String(active).padStart(2, "0")}</b>Active rentals <small>View rentals →</small></a><a class="neu stat stat-link" href="#/dashboard" data-act="jump" data-v="cashout"><b>${peso(earn)}</b>Earnings (after 10% commission) <small>Available to cash out: ${peso(balance)} →</small></a></div>
    <a href="#/reviews" class="neu item card reputation-card"><span class="ico">★</span><div><small>Your reputation</small><h2>${r ? r.v.toFixed(1) : "–"} ${stars(r ? r.v : 0)}</h2><p>${r ? r.n : 0} reviews · ${isVerified(u) ? "ID verified owner" : "Verification pending"}</p></div></a>
    <section id="cashout" class="neu cashout-panel"><h2>Cash out earnings</h2><p>Available balance: <b>${peso(balance)}</b>. Requests are sent to admin for manual processing.</p><form data-form="cashout" class="stack"><label>Amount (₱)</label><input type="number" name="amount" min="100" max="${balance.toFixed(2)}" step="0.01" required ${balance<100?'disabled':''}><label>Cash-out method</label><select name="method" required><option value="GCash">GCash</option><option value="Maya">Maya</option><option value="PayPal">PayPal</option></select><label>Account name</label><input name="accountName" required placeholder="Name registered to wallet"><label>GCash / Maya number or PayPal email</label><input name="accountRef" required placeholder="Wallet number or PayPal email"><button class="btn btn-primary" ${balance<100?'disabled':''}>Request cash out</button></form><h3 style="margin-top:1rem">Cash-out history</h3><div class="stack">${mineWithdrawals.map(w=>`<div class="neu item"><div><b>${peso(w.amount)} · ${w.method}</b><p>${w.accountRef}</p><small>${new Date(w.createdAt).toLocaleString()}</small></div>${pill(w.status)}</div>`).join('')||'<p>No cash-out requests yet.</p>'}</div></section>
    <h2 id="rental-requests" style="margin-top:1.4rem">Rental requests</h2><div class="stack">${reqs.map((b) => { const c = usr(b.renter), e = E(b.eq) || bookingEquipment(b), rr = avg(c.email);
      return `<div class="neu"><div class="item"><a href="#/member/${encodeURIComponent(c.email)}" aria-label="View ${escapeHtml(c.name)} profile">${avatar(c)}</a><div><b><a href="#/member/${encodeURIComponent(c.email)}">${escapeHtml(c.name)}</a></b> ${isVerified(c) ? "✓" : ""}<p>${rr ? stars(rr.v) + " " + rr.v.toFixed(1) : "New renter"}</p></div>${pill(b.status)}</div><p>${escapeHtml(e.name)} · ${fmt(b.start)} – ${fmt(b.end)} · ${peso(b.total)}</p><p><b>Payment:</b> ${escapeHtml(b.pay || "Not selected")} · <b>Status:</b> ${escapeHtml(String(b.paymentStatus || "pending").replaceAll("_"," "))}</p>
      ${b.status === "pending" ? `<button class="btn btn-primary btn-sm" data-act="approve" data-v="${b.ref}">Approve</button> <button class="btn btn-soft btn-sm btn-danger" data-act="decline" data-v="${b.ref}">Decline</button>` : ""}
      ${b.pay === "Cash on Delivery (COD)" && b.paymentStatus !== "paid" && b.status !== "declined" ? `<button class="btn btn-soft btn-sm" data-act="markpaid" data-v="${b.ref}">Mark payment received</button>` : ""}
      ${b.status === "approved" ? `<button class="btn btn-primary btn-sm" data-act="returned" data-v="${b.ref}">Mark returned</button>` : ""}
      ${b.status === "returned" && !b.ratedRenter ? `<a class="btn btn-primary btn-sm" href="#/rate/${b.ref}">Rate renter</a>` : ""}</div>`; }).join("") || "<p>No requests yet.</p>"}</div>`, "app"]; },

  listings: (a, u) => { const mine=db.eq.filter(e=>e.owner===u.email); return [`<h1>My listings</h1><p>Manage your equipment, daily rates, visibility, and unavailable dates.</p><div class="owner-listings owner-listings-grid">${mine.map(e=>`<section class="neu owner-listing"><div class="owner-listing-card single">${eqCard(e)}</div><div class="owner-listing-status"><b>Listing status:</b> ${pill(e.status||'approved')}<span class="pill ${e.visible===false?'warn':''}">${e.visible===false?'Hidden':'Visible to customers'}</span><button class="btn btn-soft btn-sm" type="button" data-act="visibility" data-v="${e.id}">${e.visible===false?'Make visible':'Hide listing'}</button><a class="btn btn-soft btn-sm" href="#/edit-equipment/${encodeURIComponent(e.id)}">Edit information & photos</a><a class="btn btn-soft btn-sm btn-block" href="#/equipment/${e.id}">Manage equipment & availability</a></div></section>`).join('')||'<p>No listings yet. Open Equipment to add your first machine.</p>'}</div>`,"app"]; },
  "edit-equipment": (id, u) => {
    const item = db.eq.find(e => String(e.id) === String(decodeURIComponent(id || "")) && e.owner === u.email);
    if (!item) return [`<a href="#/listings">← Back to my listings</a><section class="neu"><h2>Listing not found</h2><p>This equipment does not belong to your account.</p></section>`, "app"];
    return [`<a href="#/listings">← Back to my listings</a><h1>Edit equipment</h1><p>Update listing details or replace the main photo. Changes are sent for admin review before customers can see them.</p>
      <form data-form="equipmentedit" class="neu stack equipment-upload-form"><input type="hidden" name="eq" value="${escapeHtml(item.id)}">
      <img class="equipment-edit-preview" src="${img(item.img)}" alt="${escapeHtml(item.name)} photo">
      <label>Equipment name</label><input name="name" value="${escapeHtml(item.name)}" required>
      <label>Details</label><input name="spec" value="${escapeHtml(item.spec || "")}" placeholder="e.g. 50 HP · Diesel">
      <label>Equipment type</label><input name="cat" value="${escapeHtml(item.cat || "")}" required>
      <label>Price per day (₱)</label><input name="price" type="number" min="1" value="${escapeHtml(item.price)}" required>
      <label>Equipment location</label><input name="location" value="${escapeHtml(item.location || "")}" list="editEquipmentLocations" required><datalist id="editEquipmentLocations">${LOCATIONS.map(location=>`<option value="${escapeHtml(location)}"></option>`).join("")}</datalist>
      <label>Replace main photo (optional)</label><input name="photo" type="file" accept="image/*"><small>Photos are automatically optimized for storage. Replacing the main photo updates the first review photo.</small>
      <button class="btn btn-primary">Save and send for review</button></form>`, "app"];
  },

  papers: (a, u) => { draftUnavailableDates=[]; return [`<h1>Equipment</h1><p>Add your equipment, choose unavailable dates, and submit the equipment papers together for admin review.</p><form data-form="equipmentupload" class="neu stack equipment-upload-form"><h2>Add equipment</h2><div class="days"><div><label>Equipment name</label><input name="name" required placeholder="e.g. Farm Tractor"></div><div><label>Details</label><input name="spec" placeholder="e.g. 50 HP · Diesel"></div></div><div class="days"><div><label>Type</label><select name="cat" required>${CATS.slice(1).map(c=>`<option value="${c}">${c}</option>`).join('')}</select><label>Or enter a custom type</label><input name="catCustom" placeholder="e.g. Rice Transplanter"></div><div><label>Price per day (₱)</label><input name="price" type="number" min="1" required placeholder="2500"></div></div><label>Equipment location</label><input name="location" list="bunawanLocationsUpload" placeholder="Type your location or select a suggestion" required><datalist id="bunawanLocationsUpload">${LOCATIONS.map(l=>`<option value="${l}"></option>`).join('')}</datalist><label>Customer visibility after approval</label><select name="visible"><option value="true">Visible to customers</option><option value="false">Keep hidden from customers</option></select><div class="upload-preview-help"><h3>Equipment photos</h3><p>Upload clear photos of the machine, including plate/serial details if appropriate. Images are automatically optimized for storage.</p><input name="equipmentPhotos" type="file" accept="image/*" multiple required></div><div class="upload-preview-help"><h3>Equipment papers</h3><p>Required for admin review before this listing appears to customers.</p><label>OR/CR registration papers</label><input name="orcr" type="file" accept="image/*,.pdf" required><label>Barangay or DTI permit (optional)</label><input name="permit" type="file" accept="image/*,.pdf"></div><div class="owner-calendar-wrap"><h3>Block unavailable dates</h3><p class="muted">Tap dates to mark them with a slash as unavailable. Unmarked dates will be treated as available after approval.</p><div class="owner-calendar draft-calendar">${calendarDays('',30,true)}</div><input type="hidden" name="unavailableDates" value="[]"><div class="availability-legend"><span><i class="available-dot"></i> Available</span><span><i class="unavailable-dot"></i> Unavailable / blocked</span></div></div><p class="upload-review-note">Your listing and papers will be sent to the admin for review. Customers can see and book it only after approval unless hidden here.</p><button class="btn btn-primary btn-block">Upload equipment for review</button></form>`,"app"]; },

  commission: (a, u) => { const returned = db.bookings.filter(b => b.status === "returned"); const total = returned.reduce((s,b)=>s+Number(b.total||0),0); const commission=total*.1; const requests=db.commissionWithdrawals.filter(w=>w.admin===u.email); const allocated=requests.filter(w=>["pending","paid"].includes(w.status)).reduce((sum,w)=>sum+Number(w.amount||0),0); const balance=Math.max(0,commission-allocated); return [`<div class="head"><div><h1>Commission breakdown</h1><p>10% commission from completed and returned rentals.</p></div><a class="btn btn-soft" href="#/admin">Back to overview</a></div><div class="grid stats"><div class="neu stat"><b>${returned.length}</b>Completed rentals</div><div class="neu stat"><b>${peso(total)}</b>Completed rental value</div><div class="neu stat"><b>${peso(commission)}</b>Platform commission</div><div class="neu stat"><b>${peso(balance)}</b>Available to cash out</div></div><section class="neu cashout-panel"><h2>Cash out platform commission</h2><p>Enter the receiving account. Requests are recorded for manual transfer; AgriRenta does not initiate a wallet payment.</p><form data-form="commissioncashout" class="stack"><label>Amount (₱)</label><input type="number" name="amount" min="100" max="${balance.toFixed(2)}" step="0.01" required ${balance<100?'disabled':''}><label>Cash-out method</label><select name="method" required><option value="GCash">GCash</option><option value="Maya">Maya</option><option value="PayPal">PayPal</option></select><label>Account name</label><input name="accountName" required placeholder="Name registered to wallet"><label>GCash / Maya number or PayPal email</label><input name="accountRef" required placeholder="Wallet number or PayPal email"><button class="btn btn-primary" ${balance<100?'disabled':''}>Request commission cash out</button></form><h3>Commission cash-out history</h3><div class="stack">${requests.map(w=>`<div class="neu item"><div><b>${peso(w.amount)} · ${escapeHtml(w.method)}</b><p>${escapeHtml(w.accountName)} · ${escapeHtml(w.accountRef)}</p><small>${new Date(w.createdAt).toLocaleString()}</small></div>${pill(w.status)}${w.status==="pending"?`<button class="btn btn-soft btn-sm" data-act="commissionpaid" data-v="${escapeHtml(w.id)}">Mark transferred</button>`:""}</div>`).join("")||"<p>No commission cash-out requests yet.</p>"}</div></section><h2 style="margin-top:1rem">Completed rentals</h2><div class="stack">${returned.map(b=>`<div class="neu item"><div><b>${escapeHtml(bookingEquipment(b).name)}</b><p>${escapeHtml(b.ref)} · ${escapeHtml(usr(b.renter).name)}</p><small>${b.start} – ${b.end}</small></div><div style="text-align:right"><b>${peso(b.total)}</b><p>Commission: ${peso(Number(b.total||0)*.1)}</p></div></div>`).join("")||"<p>No completed rentals recorded yet.</p>"}</div>`, "app"]; },
  /* admin */
  admin: (a, u) => { const us = db.users.filter((x) => x.role !== "admin"), pend = queue().length, pendingWithdrawals = db.withdrawals.filter(w=>w.status==="pending"), done = db.bookings.filter((b) => b.status === "returned").reduce((s, b) => s + b.total, 0), rv = db.reviews;
    return [`<header class="hello admin-hello"><a href="index.html" class="hello-logo"><img src="logo.png" alt="AgriRenta"></a><div class="hello-copy"><small class="role-kicker">Admin</small><h1>Admin overview</h1><p>Platform activity at a glance.</p></div><span class="pill">Admin · 2FA on</span></header>
    <section class="platform-global-search"><label class="sr-only" for="adminGlobalSearch">Search users, equipment, or locations</label><input id="adminGlobalSearch" class="searchbar" type="search" placeholder="Search users, equipment, or locations..." autocomplete="off"><div id="adminGlobalSearchResults">${platformSearchResults("", u)}</div></section>
    <a class="promo admin-banner" href="#/queue" aria-label="Open admin review queue"><video autoplay muted loop playsinline preload="metadata" poster="images/adbanner.png" aria-hidden="true"><source src="adbanner.mp4" type="video/mp4"></video></a>
    <div class="grid stats"><a class="neu stat stat-link" href="#/users"><b>${us.length}</b>Registered users<small>View user accounts →</small></a><a class="neu stat stat-link" href="#/users"><b>${us.filter(isVerified).length}</b>ID verified<small>View verified users →</small></a><a class="neu stat stat-link" href="#/queue"><b>${pend}</b>Pending checks<small>Review submissions →</small></a><a class="neu stat stat-link" href="#/messages"><b>${rv.length ? (rv.reduce((s, x) => s + x.stars, 0) / rv.length).toFixed(1) : "–"}</b>Average rating<small>Open feedback →</small></a><a class="neu stat stat-link" href="#/commission"><b>${peso(done * 0.1)}</b>Commission (10% of completed)<small>View commission breakdown →</small></a></div>
    <h2>Needs attention</h2><div class="stack"><a class="neu item card" href="#/queue"><span class="ico"><i class="bi bi-exclamation-circle" aria-hidden="true"></i></span><div><b>Identity checks waiting</b><p>${pend} submissions need review</p></div><b>Review</b></a></div>
    <div class="chips"><a class="chip" href="#/queue">Review verifications & equipment</a><a class="chip" href="#/users">Manage users</a></div><h2 style="margin-top:1.2rem">Cash-out requests</h2><div class="stack">${pendingWithdrawals.map(w=>`<div class="neu item"><div><b>${usr(w.owner).name} · ${peso(w.amount)}</b><p>${w.method} · ${w.accountName} · ${w.accountRef}</p><small>${new Date(w.createdAt).toLocaleString()}</small></div><button class="btn btn-primary btn-sm" data-act="withdrawpaid" data-v="${w.id}">Mark paid</button><button class="btn btn-soft btn-sm btn-danger" data-act="withdrawreject" data-v="${w.id}">Reject</button></div>`).join('')||'<p>No pending cash-out requests.</p>'}</div>`, "app"]; },
  queue: () => [`<h1>Verification queue</h1><p>Review account checks and uploaded equipment before approval.</p><div class="stack">${queue().map(x => x.eq
    ? `<section class="neu equipment-review-card"><div class="item"><a class="messenger-avatar-link" href="#/user/${encodeURIComponent(x.u.email)}">${avatar(x.u)}</a><div><b>${escapeHtml(x.eq.name)}</b><p>${escapeHtml(x.u.name)} · Equipment listing & papers</p><small>${escapeHtml(x.eq.location || "Location not set")} · ${peso(x.eq.price)}/day</small></div>${pill("review")}</div>
      <div class="review-files"><div><b>Equipment photos</b><div class="review-thumbs">${(x.eq.photos || []).map((photo,index) => `<a href="${photo.data}" target="_blank" rel="noopener"><img src="${photo.data}" alt="Equipment photo ${index+1}"></a>`).join("") || "<p>No photo attached</p>"}</div></div>
      <div class="review-docs"><b>OR/CR</b>${x.eq.orcr ? `<a href="${x.eq.orcr.data}" target="_blank" rel="noopener">${escapeHtml(x.eq.orcr.name || "View OR/CR")}</a>` : "<p>Not attached</p>"}<b>Barangay / DTI permit</b>${x.eq.permit ? `<a href="${x.eq.permit.data}" target="_blank" rel="noopener">${escapeHtml(x.eq.permit.name || "View permit")}</a>` : "<p>Not provided</p>"}</div></div>
      <div class="row"><button class="btn btn-primary btn-sm" data-act="eqapprove" data-v="${escapeHtml(x.eq.id)}">Approve listing</button><button class="btn btn-soft btn-sm btn-danger" data-act="eqreject" data-v="${escapeHtml(x.eq.id)}">Reject listing</button><a class="btn btn-soft btn-sm" href="#/messages/${encodeURIComponent(x.u.email)}" aria-label="Message ${escapeHtml(x.u.name)}"><i class="bi bi-chat-dots" aria-hidden="true"></i> Message owner</a></div></section>`
    : `<section class="neu"><div class="item"><a class="messenger-avatar-link" href="#/user/${encodeURIComponent(x.u.email)}">${avatar(x.u)}</a><div><b>${escapeHtml(x.u.name)}</b><p>${escapeHtml(x.u.role)} · ${escapeHtml(x.kind)}</p></div></div>${x.kind === "ID + selfie" ? idDocsHtml(x.u) : ""}<small>${x.kind === "Equipment papers" ? "Owner equipment documents are pending review." : "Face match (sample)"}</small><div class="row"><div class="bar"><i style="width:${x.fm}%"></i></div><b>${x.fm}%</b></div>
      <div class="row"><button class="btn btn-primary btn-sm" data-act="vok" data-v="${escapeHtml(x.u.email)}|${escapeHtml(x.kind)}">Approve</button><button class="btn btn-soft btn-sm btn-danger" data-act="vno" data-v="${escapeHtml(x.u.email)}|${escapeHtml(x.kind)}">Reject</button><a class="btn btn-soft btn-sm" href="#/messages/${encodeURIComponent(x.u.email)}" aria-label="Message ${escapeHtml(x.u.name)}"><i class="bi bi-chat-dots" aria-hidden="true"></i> Message user</a></div></section>`).join("") || "<p><i class=\"bi bi-check-circle\" aria-hidden=\"true\"></i> Nothing waiting.</p>"}</div>`, "app"],
  users: () => [`<h1>Users</h1><p>Open a user record to review profile details, verification documents, ratings, and equipment submissions.</p><div class="stack">${db.users.map(user => `<article class="neu item admin-user-card"><a class="messenger-avatar-link" href="#/user/${encodeURIComponent(user.email)}">${avatar(user)}</a><a class="admin-user-profile" href="#/user/${encodeURIComponent(user.email)}"><b>${escapeHtml(user.name)}</b><p>${escapeHtml(user.email)} · ${roleLabel(user)}</p></a>${user.role === "admin" ? "" : badge(user)}<a class="btn btn-soft btn-sm" href="#/user/${encodeURIComponent(user.email)}">View profile</a>${user.role === "admin" ? "" : `<a class="btn btn-soft btn-sm" href="#/messages/${encodeURIComponent(user.email)}" aria-label="Message ${escapeHtml(user.name)}"><i class="bi bi-chat-dots" aria-hidden="true"></i></a>`}</article>`).join("")}</div>`, "app"]
};
const queue = () => [...db.users.flatMap((u) => [u.v.id === "review" ? { u, kind: "ID + selfie" } : null, u.v.papers === "review" ? { u, kind: "Equipment papers" } : null].filter(Boolean).map(x=>({...x,fm:70+(u.email.length*7)%28}))), ...db.eq.filter(e=>e.status==="review").map(eq=>({u:usr(eq.owner),kind:"Equipment listing",eq,fm:0}))];

function notificationRecords(u) {
  const rows = [];
  const messageRows = db.messages.filter(message => {
    const thread = String(threadOf(message));
    if (message.author === u.email) return false;
    if (u.role === "admin") return !thread.startsWith("direct:");
    return thread === u.email || (thread.startsWith("direct:") && thread.slice(7).split("|").includes(u.email));
  });
  for (const message of messageRows) {
    const thread = String(threadOf(message));
    const href = u.role === "admin" ? `#/messages/${encodeURIComponent(thread)}`
      : thread.startsWith("direct:") ? `#/messages/${encodeURIComponent(thread)}` : "#/messages";
    rows.push({ id:`message:${message.id}`, tab:"messages", title:`New message from ${usr(message.author).name}`,
      description:String(message.text || "").slice(0, 180), href, time:message.time });
  }
  if (u.role === "customer") {
    for (const booking of db.bookings.filter(item => item.renter === u.email && item.status !== "pending")) {
      rows.push({ id:`booking:${booking.ref}:${booking.status}`, tab:"bookings", title:`Rental ${booking.status}`,
        description:`${bookingEquipment(booking).name} · ${booking.ref}`, href:`#/submitted/${encodeURIComponent(booking.ref)}`, time:booking.statusUpdatedAt || booking.createdAt });
    }
  } else if (u.role === "owner") {
    for (const booking of db.bookings.filter(item => item.owner === u.email && item.status === "pending")) {
      rows.push({ id:`request:${booking.ref}`, tab:"dashboard", title:"New rental request",
        description:`${usr(booking.renter).name} requested ${bookingEquipment(booking).name}.`, href:"#/dashboard", time:booking.createdAt });
    }
    for (const item of db.eq.filter(equipment => equipment.owner === u.email && equipment.status === "rejected")) {
      rows.push({ id:`listing-rejected:${item.id}`, tab:"listings", title:"Equipment listing needs changes",
        description:`${item.name} was not approved. Review the listing and its documents.`, href:`#/equipment/${item.id}`, time:item.reviewedAt || item.createdAt });
    }
  } else if (u.role === "admin") {
    for (const item of queue()) {
      const id = item.eq ? `equipment-review:${item.eq.id}` : `verification:${item.u.email}:${item.kind}`;
      rows.push({ id, tab:"queue", title:item.eq ? "Equipment review waiting" : "Verification review waiting",
        description:item.eq ? `${item.u.name} submitted ${item.eq.name}.` : `${item.u.name} submitted ${item.kind}.`,
        href:item.eq ? "#/queue" : `#/user/${encodeURIComponent(item.u.email)}` });
    }
    for (const withdrawal of db.withdrawals.filter(item => item.status === "pending")) {
      rows.push({ id:`cashout:${withdrawal.id}`, tab:"admin", title:"Cash-out request waiting",
        description:`${usr(withdrawal.owner).name} requested ${peso(withdrawal.amount)} via ${withdrawal.method}.`, href:"#/admin", time:withdrawal.createdAt });
    }
  }
  return rows.sort((a,b) => new Date(b.time || 0) - new Date(a.time || 0));
}

/* Optimize uploaded images before storing them with the application state. */
const compressImage = (file, max = 1000, quality = .72) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error("read failed"));
  reader.onload = () => {
    const im = new Image();
    im.onerror = () => reject(new Error("image failed"));
    im.onload = () => {
      const s = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(im.width * s)); c.height = Math.max(1, Math.round(im.height * s));
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    im.src = reader.result;
  };
  reader.readAsDataURL(file);
});
/* Admin view of the ID front/back and selfie that a user submitted. */
const idDocsHtml = (t) => { const d = t.idDocs; if (!d) return '<p>No ID photos were saved for this submission (submitted before this update). Ask the user to resubmit.</p>';
  const open = "fetch(this.src).then(r=>r.blob()).then(b=>window.open(URL.createObjectURL(b)))";
  return `<div class="review-files"><div><b>${d.type || "Government ID"} (front / back)</b><div class="review-thumbs">${[d.front, d.back].map((s, i) => `<img src="${s}" alt="ID ${i ? "back" : "front"}" style="cursor:zoom-in" onclick="${open}">`).join("")}</div></div><div><b>Selfie</b><div class="review-thumbs"><img src="${d.selfie}" alt="Selfie" style="cursor:zoom-in" onclick="${open}"></div></div></div>`; };

/* Role-aware pending activity badges. Counts point users to the section needing attention. */
function navNoticeCount(u, tab) {
  if (!u) return 0;
  const read = new Set(db.notificationReads[u.email] || []);
  if (tab === "alerts") return notificationRecords(u).filter(item => !read.has(item.id)).length;
  return notificationRecords(u).filter(item => item.tab === tab && !read.has(item.id)).length;
}

/* ---------- Shell + router ---------- */
const TABS = {
  customer: [["home", "Home", '<i class="bi bi-house-door"></i>'], ["explore", "Explore", '<i class="bi bi-search"></i>'], ["bookings", "Bookings", '<i class="bi bi-calendar-check"></i>'], ["alerts", "Alerts", '<i class="bi bi-bell"></i>'], ["messages", "Messages", '<i class="bi bi-chat-dots"></i>'], ["profile", "Profile", '<i class="bi bi-person-circle"></i>']],
  owner: [["dashboard", "Dashboard", '<i class="bi bi-house-door"></i>'], ["listings", "My listings", '<i class="bi bi-list-ul"></i>'], ["papers", "Equipment", '<i class="bi bi-file-earmark-text"></i>'], ["alerts", "Alerts", '<i class="bi bi-bell"></i>'], ["messages", "Messages", '<i class="bi bi-chat-dots"></i>'], ["profile", "Profile", '<i class="bi bi-person-circle"></i>']],
  admin: [["admin", "Overview", '<i class="bi bi-speedometer2"></i>'], ["queue", "Verify", '<i class="bi bi-shield-check"></i>'], ["users", "Users", '<i class="bi bi-people"></i>'], ["alerts", "Alerts", '<i class="bi bi-bell"></i>'], ["messages", "Messages", '<i class="bi bi-chat-dots"></i>'], ["profile", "Profile", '<i class="bi bi-gear"></i>']],
  guest: [["explore", "Explore", '<i class="bi bi-search"></i>'], ["login", "Log in", '<i class="bi bi-box-arrow-in-right"></i>']]
};
const shell = (html, name, u) => `<div class="shell"><aside class="side"><a class="brand" href="index.html"><img src="logo.png" alt=""></a>
  <nav class="nav">${TABS[u ? u.role : "guest"].map((t) => { const count = navNoticeCount(u,t[0]); return `<a href="#/${t[0]}" class="${name === t[0] ? "on" : ""}"><span class="nav-icon-wrap">${t[2]}${count ? `<i class="notification-badge" aria-label="${count} notifications">${count > 9 ? "9+" : count}</i>` : ""}</span>${t[1]}</a>`; }).join("")}</nav>
  <div class="foot">${u ? `<div class="account-mini">${avatar(u)}<div><small class="role-kicker-dark">${roleLabel(u)}</small><b>${u.name}</b><a href="#" data-act="logout"><i class="bi bi-box-arrow-right"></i> Log out</a></div></div>` : `<a href="#/register"><b>Create account</b></a>`}</div></aside><main class="main">${serverApiEnabled ? "" : `<div class="server-mode-warning" role="status"><b>Local-only mode:</b> changes are saved in this browser and will not appear in other accounts. Connect Supabase (see <code>supabase-config.js</code> and README.md) to share equipment and account data.</div>`}${html}</main></div>`;

function render() {
  const [, name = "", arg] = location.hash.slice(1).split("/"), u = me();
  const pub = ["welcome", "login", "register", "explore", "equipment", "owner", "member"];
  if (u && rolePending && name !== "choose-role") return go("#/choose-role");
  if (u && !rolePending && name === "choose-role") return go(homeOf(u));
  if (!name) return go(u ? homeOf(u) : "#/welcome");
  if (!V[name]) return go("#/");
  if (!u && !pub.includes(name)) return go("#/login");
  const adminOnly = ["admin", "queue", "users", "commission", "user"];
  const ownerOnly = ["dashboard", "listings", "papers", "edit-equipment"];
  if (u && adminOnly.includes(name) && u.role !== "admin") return go(homeOf(u));
  if (u && ownerOnly.includes(name) && u.role !== "owner") return go(homeOf(u));
  const [html, mode] = V[name](arg, u);
  document.body.classList.toggle("auth", mode === "auth");
  app.innerHTML = mode === "auth" ? html : shell(html, name, u);
  window.scrollTo(0, 0);
  if (name === "verify-mobile") { const o = [...app.querySelectorAll(".otp input")]; if (o[0]) o[0].focus(); o.forEach((i, n) => i.addEventListener("input", () => { i.value = i.value.replace(/\D/g, "").slice(0,1); if (i.value && o[n + 1]) o[n + 1].focus(); })); }
  if (name === "confirm") {
    const details = $("#onlinePaymentDetails");
    const radios = [...app.querySelectorAll('input[name="pay"]')];
    const updatePaymentFields = () => {
      const method = app.querySelector('input[name="pay"]:checked')?.value || "";
      const title = $("#paymentFormTitle"), hint = $("#paymentFormHint"), message = $("#paymentMethodMessage");
      const submitButton = app.querySelector('form[data-form="confirm"] button[type="submit"], form[data-form="confirm"] button:not([type])');
      if (details) details.hidden = !method;
      const info = {
        "GCash": { title:"GCash demo checkout", hint:"Continue to the AgriRenta GCash demonstration.", message:"<b>GCash payment demo</b><p>This academic demo does not process a real payment. Never enter your GCash PIN or OTP here.</p>", button:"Continue to GCash Demo" },
        "Cash on Delivery (COD)": { title:"Cash on Delivery / Collection", hint:"No online payment is started for this method.", message:"<b>Pay when the rental is delivered or collected</b><p>The booking request will be sent to the equipment owner. The owner/admin must mark the payment as received after collecting the money.</p>", button:"Submit Rental Request" }
      };
      const selected = info[method];
      if (title) title.textContent = selected?.title || "Payment instructions";
      if (hint) hint.textContent = selected?.hint || "Choose a payment method to see the next step.";
      if (message) message.innerHTML = selected?.message || "";
      if (submitButton) submitButton.textContent = selected?.button || "Submit Rental Request";
    };
    radios.forEach(r => r.addEventListener("change", updatePaymentFields));
    updatePaymentFields();
  }
}
window.addEventListener("hashchange", render);

/* ---------- Actions ---------- */
const rerender = () => { const y = scrollY; render(); scrollTo(0, y); };
document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-act]"); if (!el) return;
  const a = el.dataset.act, v = el.dataset.v, u = me(), b = db.bookings.find((x) => x.ref === v);
  if (a !== "cat" || el.tagName === "BUTTON") e.preventDefault();
  if (a === "logout") { fetch("/api/logout", { method:"POST", credentials:"same-origin" }).catch(() => {}); db.me = null; save(); go("#/welcome"); render(); }
  else if (a === "marknotification") { if (!u) return; const id = decodeURIComponent(v || ""); db.notificationReads[u.email] = [...new Set([...(db.notificationReads[u.email] || []), id])]; await save(); rerender(); }
  else if (a === "google") { if (window.agrirentaGoogleLogin) window.agrirentaGoogleLogin().catch(() => toast("Could not start Google sign-in. Please try again.")); else toast("Google sign-in needs Supabase to be connected (see supabase-config.js)."); }
  else if (a === "forgot") toast("Password reset email will be sent through Supabase (next step).");
  else if (a === "resend") toast("Code resent (demo).");
  else if (a === "verifylater") { if (!u) return go("#/login"); toast("You can finish verification later from your profile."); go(homeOf(u)); }
  else if (a === "role") { regRole = v; rerender(); }
  else if (a === "setrole") {
    try {
      const response = await fetch("/api/role", { method:"POST", credentials:"same-origin", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ role: regRole }) });
      const result = await response.json();
      if (!response.ok || !result.ok) return toast(result.error || "Could not save your choice.");
      rolePending = false;
      location.hash = "#/verify-mobile";
      location.reload();
    } catch (err) { toast("Could not reach the AgriRenta backend."); }
  }
  else if (a === "idtype") { idType = v; rerender(); }
  else if (a === "jump") { const target = document.getElementById(v); if (target) target.scrollIntoView({ behavior: "smooth", block: "start" }); }
  else if (a === "cat") { cat = v; if (el.tagName === "BUTTON") rerender(); }
  else if (a === "visibility") { if(u?.role!=="owner") return toast("Only the equipment owner can change listing visibility."); const item=db.eq.find(x=>String(x.id)===String(v)&&x.owner===u.email); if(!item) return toast("Equipment listing not found."); const previous=item.visible; item.visible=item.visible===false; if(!await save()){item.visible=previous;return;} toast(item.visible?"Listing is visible to customers after approval.":"Listing hidden from customers."); rerender(); }
  else if (a === "bookingdetails") { if (e.target.closest("a, button, input, textarea, select, label")) return; go("#/equipment/" + v); }
  else if (a === "favorite") { if (!u) { toast("Log in to save favorites."); go("#/login"); return; } const key = String(v); const saved = (db.favorites[u.email] || []).map(String); db.favorites[u.email] = saved.includes(key) ? saved.filter((x) => x !== key) : [...saved, key]; save(); rerender(); }
  else if (a === "unblock") { db.availability = db.availability.filter((x) => String(x.id) !== String(v) || x.owner !== u?.email); save(); toast("Blocked dates removed."); rerender(); }
  else if (a === "toggleavailability") { if(u?.role!=="owner") return toast("Only the equipment owner can change availability."); const item=db.eq.find(x=>String(x.id)===String(v)&&x.owner===u.email); const day=el.dataset.date; if(!item||!day) return; if(dayIsBooked(v,day)) return toast("This date is already booked and cannot be changed."); const existing=db.availability.find(x=>Number(x.eq)===Number(v)&&x.owner===u.email&&x.start===day&&x.end===day); if(existing) db.availability=db.availability.filter(x=>x!==existing); else db.availability.push({id:Date.now(),eq:Number(v),owner:u.email,start:day,end:day,reason:"Owner marked unavailable"}); save(); rerender(); }
  else if (a === "draftday") { const day=el.dataset.date; if(!day) return; draftUnavailableDates=draftUnavailableDates.includes(day)?draftUnavailableDates.filter(x=>x!==day):[...draftUnavailableDates,day]; el.classList.toggle("unavailable",draftUnavailableDates.includes(day));el.classList.toggle("available",!draftUnavailableDates.includes(day));el.classList.toggle("selected",draftUnavailableDates.includes(day));const sm=el.querySelector('small');if(sm)sm.textContent=draftUnavailableDates.includes(day)?'Unavailable':'Available';const hidden=app.querySelector('input[name="unavailableDates"]');if(hidden)hidden.value=JSON.stringify(draftUnavailableDates); }
  else if (a === "eqapprove" || a === "eqreject") { if(u?.role!=="admin") return toast("Only admin can review equipment listings."); const item=db.eq.find(x=>String(x.id)===String(v)); if(!item) return toast("Equipment listing not found."); item.status=a==="eqapprove"?"approved":"rejected"; const ownerAccount=usr(item.owner); if(ownerAccount.v){const otherPending=db.eq.some(x=>x.id!==item.id&&x.owner===item.owner&&x.status==="review");ownerAccount.v.papers=a==="eqapprove"&&!otherPending?"ok":(otherPending?"review":"none");} item.reviewedAt=new Date().toISOString(); item.reviewedBy=u.email; save(); toast(a==="eqapprove"?(item.visible===false?"Equipment approved but remains hidden from customers.":"Equipment listing approved and now visible to customers."):"Equipment listing rejected."); rerender(); }
  else if (a === "withdrawpaid" || a === "withdrawreject") { if(u?.role!=="admin") return toast("Only admin can process cash-out requests."); const w=db.withdrawals.find(x=>String(x.id)===String(v)); if(!w) return toast("Cash-out request not found."); w.status=a==="withdrawpaid"?"paid":"rejected"; w.processedAt=new Date().toISOString();w.processedBy=u.email;save();toast(a==="withdrawpaid"?"Marked as paid. Complete the transfer in the selected wallet separately.":"Cash-out request rejected.");rerender(); }
  else if (a === "commissionpaid") { if(u?.role!=="admin") return toast("Only admin can update commission cash-outs."); const request=db.commissionWithdrawals.find(x=>String(x.id)===String(v)&&x.admin===u.email); if(!request||request.status!=="pending") return toast("Commission cash-out request not found."); request.status="paid"; request.processedAt=new Date().toISOString(); save(); toast("Commission transfer recorded as complete."); rerender(); }
  else if (a === "star") { rate.stars = +v; rerender(); }
  else if (a === "adminstar") { rate.stars = +v; rerender(); }
  else if (a === "tag") { rate.tags = rate.tags.includes(v) ? rate.tags.filter((t) => t !== v) : [...rate.tags, v]; rerender(); }
  else if (a === "cancel") { if (!b || u?.role !== "customer" || b.renter !== u.email || b.status !== "pending") return toast("Only your pending bookings can be cancelled."); db.bookings = db.bookings.filter((x) => x.ref !== v); save(); toast("Booking cancelled."); rerender(); }
  else if (["approve", "decline", "returned"].includes(a)) { if (!b || u?.role !== "owner" || b.owner !== u.email) return toast("Only the equipment owner can update this booking."); b.status = a === "approve" ? "approved" : a === "decline" ? "declined" : "returned"; b.statusUpdatedAt=new Date().toISOString(); save(); toast("Booking " + b.status + "."); rerender(); }
  else if (a === "markpaid") { if (!b || (u?.role !== "admin" && (u?.role !== "owner" || b.owner !== u.email))) return toast("Only the equipment owner or admin can verify a manual payment."); if (b.pay !== "Cash on Delivery (COD)") return toast("Only COD payments can be marked received manually."); b.paymentStatus = "paid"; b.paymentVerifiedAt = new Date().toISOString(); b.paymentVerifiedBy = u.email; save(); toast("Manual payment marked as received."); rerender(); }
  else if (a === "vok" || a === "vno") { if (u?.role !== "admin") return toast("Only admin can review verification requests."); const [em, kind] = v.split("|"), t = db.users.find(x => x.email === em); if (!t) return toast("User not found."); const ok = a === "vok"; if (serverApiEnabled) { try { const response = await fetch("/api/admin/verification", { method:"POST", credentials:"same-origin", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email:em, kind, approved:ok }) }); const result = await response.json(); if (!response.ok || !result.ok) return toast(result.error || "Could not save verification decision."); } catch (err) { return toast("Could not reach the AgriRenta backend."); } } if (kind === "Equipment papers") t.v.papers = ok ? "ok" : "none"; else { t.v.id = ok ? "ok" : "none"; t.v.selfie = ok ? "ok" : "none"; } save(); toast(ok ? "Approved." : "Rejected."); rerender(); }
});
document.addEventListener("keydown", (e) => {
  const card = e.target.closest('[data-act="bookingdetails"]');
  if (card && (e.key === "Enter" || e.key === " ") && !e.target.closest("a, button, input, textarea, select, label")) { e.preventDefault(); go("#/equipment/" + card.dataset.v); }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "q" && $("#list")) { q = e.target.value; $("#list").innerHTML = list(); }
  if (e.target.id === "q" && $("#homeEquipmentList")) {
    q = e.target.value;
    $("#homeEquipmentList").innerHTML = filteredAvailableEquipment(q).map(eqCard).join("") || "<p>No equipment matches your search. Try another name, type, or location.</p>";
  }
  if (e.target.id === "maxPrice" && $("#list")) { maxPrice = e.target.value; $("#list").innerHTML = list(); }
  if (e.target.id === "adminGlobalSearch" || e.target.id === "ownerGlobalSearch") {
    const results = $("#" + (e.target.id === "adminGlobalSearch" ? "adminGlobalSearchResults" : "ownerGlobalSearchResults"));
    if (results) results.innerHTML = platformSearchResults(e.target.value, me());
  }
  if (e.target.id === "chatSearch") {
    const query = e.target.value.trim().toLowerCase();
    const rows = [...app.querySelectorAll("[data-chat-contact]")];
    rows.forEach(row => { row.hidden = !row.dataset.search.toLowerCase().includes(query); });
    const list = e.target.closest(".messenger-contacts")?.querySelector(".messenger-contact-list");
    if (list) {
      let empty = list.querySelector("[data-chat-no-results]");
      if (!empty) { empty = document.createElement("p"); empty.className = "empty-state"; empty.dataset.chatNoResults = ""; empty.textContent = "No users matched your search."; list.append(empty); }
      empty.hidden = !query || rows.some(row => !row.hidden);
    }
  }
});
document.addEventListener("change", (e) => { if (e.target.id === "sortBy" && $("#list")) { sortBy = e.target.value; $("#list").innerHTML = list(); } });
document.addEventListener("submit", async (e) => {
  const f = e.target.closest("form[data-form]"); if (!f) return; e.preventDefault();
  const d = Object.fromEntries(new FormData(f)), k = f.dataset.form, u = me();
  if (k === "login") {
    const x = db.users.find((y) => y.email === d.email.trim().toLowerCase());
    if (serverApiEnabled) {
      try {
        const response = await fetch("/api/login", { method:"POST", credentials:"same-origin", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email:d.email, password:d.pw, code:d.code }) });
        const result = await response.json();
        if (!response.ok || !result.ok) return toast(result.error || "Login failed.");
        const stateResponse = await fetch("/api/state", { credentials:"same-origin", headers:{"Accept":"application/json"} });
        const snapshot = await stateResponse.json();
        if (!stateResponse.ok || !snapshot.ok || !snapshot.state) return toast(snapshot.error || "Could not load your account data.");
        const pending = readPendingState();
        if (pending?.me === result.user.email) {
          normalizeState(pending);
          db.me = result.user.email;
          if (!await save()) return;
        } else {
          demoCatalogChanged = normalizeState(snapshot.state);
          db.me = result.user.email;
          if (demoCatalogChanged) {
            if (!await save()) return;
          } else localStorage.setItem("agri", JSON.stringify(db));
        }
        const requestedEquipment = sessionStorage.getItem("agri_book_after_login");
        const equipment = requestedEquipment && db.eq.find(item => item.name === requestedEquipment && (!item.status || item.status === "approved"));
        if (equipment) { sessionStorage.removeItem("agri_book_after_login"); go("#/book/" + equipment.id); }
        else go(homeOf({ role:result.user.role }));
        return;
      } catch (err) {
        return toast("Could not reach the AgriRenta backend. Check your internet connection and the Supabase setup, then try again.");
      }
    }
    if (!x || x.pw !== d.pw) return toast("Wrong email or password.");
    if (x.role === "admin" && d.code !== "123456") return toast("Admin accounts need the 2FA code (demo: 123456).");
    db.me = x.email; save();
    const requestedEquipment = sessionStorage.getItem("agri_book_after_login");
    const equipment = requestedEquipment && db.eq.find(item => item.name === requestedEquipment && (!item.status || item.status === "approved"));
    if (equipment) { sessionStorage.removeItem("agri_book_after_login"); go("#/book/" + equipment.id); }
    else go(homeOf(x));
  } else if (k === "personal") {
    const name = (d.name || "").trim(), email = (d.email || "").trim().toLowerCase();
    if (!name || !email) return toast("Name and email are required.");
    if (email !== u.email && db.users.some(x => x.email === email)) return toast("That email is already used by another account.");
    if (serverApiEnabled) {
      try {
        const response = await fetch("/api/profile", { method:"PUT", credentials:"same-origin", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ name, email, phone:d.phone, address:d.address }) });
        const result = await response.json();
        if (!response.ok || !result.ok) return toast(result.error || "Could not update account details.");
      } catch (err) { return toast("Could not reach the AgriRenta backend."); }
    }
    const oldEmail = u.email; u.name = name; u.phone = (d.phone || "").trim(); u.address = (d.address || "").trim(); u.email = email;
    if (db.favorites[oldEmail]) { db.favorites[email] = db.favorites[oldEmail]; delete db.favorites[oldEmail]; }
    for (const b of db.bookings) { if (b.renter === oldEmail) b.renter = email; if (b.owner === oldEmail) b.owner = email; }
    for (const m of db.messages) { if (m.author === oldEmail) m.author = email; if (m.from === oldEmail) m.from = email; if (m.thread === oldEmail) m.thread = email; if (typeof m.thread === "string" && m.thread.startsWith("direct:")) m.thread = m.thread.split(oldEmail).join(email); }
    for (const r of db.reviews) { if (r.to === oldEmail) r.to = email; if (r.from === oldEmail) r.from = email; }
    db.me = email; save(); toast("Personal information updated."); rerender();
  } else if (k === "password") {
    if ((d.newPassword || "").length < 8) return toast("New password must be at least 8 characters.");
    if (d.newPassword !== d.confirmPassword) return toast("New passwords do not match.");
    if (serverApiEnabled) {
      try {
        const response = await fetch("/api/password", { method:"POST", credentials:"same-origin", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ currentPassword:d.currentPassword, newPassword:d.newPassword }) });
        const result = await response.json();
        if (!response.ok || !result.ok) return toast(result.error || "Could not update password.");
      } catch (err) { return toast("Could not reach the AgriRenta backend."); }
    } else {
      if (d.currentPassword !== u.pw) return toast("Current password is incorrect.");
      u.pw = d.newPassword;
    }
    save(); toast("Password updated."); f.reset();
  } else if (k === "avatar") {
    const file = f.querySelector('input[name="avatar"]').files[0];
    if (!file || !file.type.startsWith("image/")) return toast("Please choose an image file.");
    try {
      u.avatar = await compressImage(file, 1600, .84);
      if (!await save()) return;
      toast("Profile picture saved to your AgriRenta account.");
      rerender();
    } catch (err) { toast("Could not read that image. Try another file."); }
  } else if (k === "updatelocation") {
    const item = db.eq.find(x => String(x.id) === String(d.eq) && x.owner === u.email);
    if (!item) return toast("Equipment listing not found.");
    if (!(d.location||"").trim()) return toast("Enter an equipment location.");
    item.location = d.location.trim(); save(); toast("Equipment location updated."); rerender();
  } else if (k === "equipmentedit") {
    if (!u || u.role !== "owner") return toast("Only equipment owners can edit listings.");
    const item = db.eq.find(x => String(x.id) === String(d.eq) && x.owner === u.email);
    if (!item) return toast("Equipment listing not found.");
    const name = (d.name || "").trim(), category = (d.cat || "").trim(), location = (d.location || "").trim(), price = Number(d.price);
    if (!name || !category || !location || !Number.isFinite(price) || price < 1) return toast("Enter a name, type, location, and valid daily price.");
    const photo = f.querySelector('input[name="photo"]').files[0];
    if (photo && !photo.type.startsWith("image/")) return toast("Choose an image file for the equipment photo.");
    let updatedPhoto;
    try { if (photo) updatedPhoto = await compressImage(photo, 1200, .78); }
    catch (err) { return toast("Could not read the equipment photo. Try a different image."); }
    item.name = name;
    item.spec = (d.spec || "").trim();
    item.cat = category;
    item.price = price;
    item.location = location;
    if (updatedPhoto) {
      item.img = updatedPhoto;
      const photos = Array.isArray(item.photos) ? item.photos : [];
      item.photos = [{ name: photo.name, type: "image/jpeg", data: updatedPhoto }, ...photos.slice(1)];
    }
    item.status = "review";
    item.updatedAt = new Date().toISOString();
    u.v.papers = "review";
    if (!await save()) return;
    toast("Equipment details saved and sent to admin for review.");
    go("#/listings");
  } else if (k === "cashout") {
    if(!u||u.role!=="owner") return toast("Only equipment owners can request a cash out.");
    const earned=db.bookings.filter(b=>b.owner===u.email&&b.status==="returned").reduce((sum,b)=>sum+Number(b.total||0)*.9,0);
    const prior=db.withdrawals.filter(w=>w.owner===u.email&&["pending","approved","paid"].includes(w.status)).reduce((sum,w)=>sum+Number(w.amount||0),0);
    const amount=Number(d.amount); if(!Number.isFinite(amount)||amount<100||amount>earned-prior+0.001) return toast("Enter an amount within your available balance (minimum ₱100).");
    if(!d.accountName.trim()||!d.accountRef.trim()) return toast("Enter the wallet account details.");
    db.withdrawals.push({id:"WD-"+Date.now(),owner:u.email,amount,method:d.method,accountName:d.accountName.trim(),accountRef:d.accountRef.trim(),status:"pending",createdAt:new Date().toISOString()});if(!await save()) return;toast("Cash-out request sent to admin for manual processing.");rerender();
  } else if (k === "commissioncashout") {
    if(!u||u.role!=="admin") return toast("Only admin can request a commission cash out.");
    const earned=db.bookings.filter(b=>b.status==="returned").reduce((sum,b)=>sum+Number(b.total||0)*.1,0);
    const allocated=db.commissionWithdrawals.filter(w=>w.admin===u.email&&["pending","paid"].includes(w.status)).reduce((sum,w)=>sum+Number(w.amount||0),0);
    const amount=Number(d.amount);
    if(!Number.isFinite(amount)||amount<100||amount>earned-allocated+0.001) return toast("Enter an amount within the available commission balance (minimum ₱100).");
    if(!["GCash","Maya","PayPal"].includes(d.method)||!d.accountName.trim()||!d.accountRef.trim()) return toast("Enter a valid payment method and wallet account details.");
    db.commissionWithdrawals.push({id:"CM-"+Date.now(),admin:u.email,amount,method:d.method,accountName:d.accountName.trim(),accountRef:d.accountRef.trim(),status:"pending",createdAt:new Date().toISOString()});
    if(!await save()) return;toast("Commission cash-out request recorded. Complete the wallet transfer manually.");rerender();
  } else if (k === "equipmentupload") {
    if(!u||u.role!=="owner") return toast("Only equipment owners can upload listings.");
    const photos=[...f.querySelector('input[name="equipmentPhotos"]').files], orcr=f.querySelector('input[name="orcr"]').files[0], permit=f.querySelector('input[name="permit"]').files[0];
    if(!photos.length||photos.some(file=>!file.type.startsWith("image/"))) return toast("Choose one or more equipment image files.");
    if(!orcr) return toast("Choose the required OR/CR registration paper.");
    const readFile=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve({name:file.name,type:file.type,data:reader.result});reader.onerror=()=>reject(new Error("Could not read one of the selected files."));reader.readAsDataURL(file);});
    try {
      const encodedPhotos=await Promise.all(photos.map(async file=>({name:file.name,type:"image/jpeg",data:await compressImage(file,1600,.84)})));
      const [encodedOrcr,encodedPermit]=await Promise.all([readFile(orcr),permit?readFile(permit):null]);
      const cat=(d.catCustom||"").trim()||d.cat; const item={id:Date.now(),name:(d.name||"").trim(),spec:(d.spec||"").trim(),cat,img:encodedPhotos[0].data,photos:encodedPhotos,orcr:encodedOrcr,permit:encodedPermit,price:Number(d.price),rating:0,n:0,owner:u.email,location:(d.location||"").trim(),visible:d.visible!=="false",status:"review",createdAt:new Date().toISOString(),unavailableDates:JSON.parse(d.unavailableDates||"[]")};
      if(!item.name||!item.location||!Number.isFinite(item.price)||item.price<1) return toast("Complete the equipment name, location, and valid daily price.");
      db.eq.push(item); u.v.papers="review"; for(const day of item.unavailableDates) db.availability.push({id:Date.now()+Math.random(),eq:Number(item.id),owner:u.email,start:day,end:day,reason:"Owner marked unavailable before upload"}); if(!await save()) return; draftUnavailableDates=[]; toast("Equipment and papers uploaded for admin review. Customers will see it after approval."); go("#/listings");
    } catch(err) { toast(err.message||"Could not process the selected uploads. Please try again."); }
  } else if (k === "adminrating") {
    if (!u || !["customer", "owner"].includes(u.role)) return toast("Only customers and equipment owners can rate admin support.");
    const adminUser = db.users.find(x => x.role === "admin");
    if (!adminUser) return toast("Admin account was not found.");
    const existing = db.reviews.find(x => x.type === "admin" && x.from === u.email);
    const reviewData = { type: "admin", to: adminUser.email, from: u.email, stars: rate.stars, text: (d.text || "").trim(), date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) };
    if (existing) Object.assign(existing, reviewData); else db.reviews.push(reviewData);
    save(); toast(existing ? "Admin rating updated." : "Thanks for rating AgriRenta admin support!"); rerender();
  } else if (k === "message") {
    const body = (d.text || "").trim();
    if (!body) return toast("Please enter a message.");
    const to = f.dataset.to;
    if (!to) return toast("Choose a conversation first.");
    let thread = to;
    if (u.role === "admin") {
      if (to.startsWith("direct:")) {
        const pair = to.slice(7).split("|");
        if (pair.length !== 2 || !pair.some(email => db.users.some(x => x.email === email && x.role !== "admin"))) return toast("Choose a valid direct conversation.");
      } else if (!db.users.some(x => x.email === to && x.role !== "admin")) return toast("Choose a valid user conversation.");
    } else if (to.startsWith("direct:")) {
      if (!to.slice(7).split("|").includes(u.email)) return toast("You cannot access that conversation.");
    } else thread = u.email; // customer/owner support messages stay in their existing admin thread
    db.messages.push({ id: Date.now(), from: thread, thread, author: u.email, text: body, time: new Date().toISOString() });
    if(!await save()) return; toast("Message sent."); rerender();
  } else if (k === "register") {
    const email = d.email.trim().toLowerCase();
    if (d.pw !== d.pw2) return toast("Passwords do not match.");
    if (db.users.some((y) => y.email === email)) return toast("That email is already registered.");
    if (serverApiEnabled) {
      try {
        const response = await fetch("/api/register", { method:"POST", credentials:"same-origin", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email, name:d.name, phone:d.phone, role:regRole, password:d.pw }) });
        const result = await response.json();
        if (!response.ok || !result.ok) return toast(result.error || "Could not create account.");
      } catch (err) { return toast("Could not reach the AgriRenta backend."); }
    }
    db.users.push({ email, name: d.name, role: regRole, phone: d.phone, pw: serverApiEnabled ? undefined : d.pw, v: { email: 1 } }); db.me = email; save(); go("#/verify-mobile");
  } else if (k === "otp") { u.v.mobile = 1; save(); toast("Mobile verified."); go("#/verify-id"); }
  else if (k === "id") {
    const idFiles = [...f.querySelectorAll('input[type="file"]')].map((i) => i.files[0]);
    if (idFiles.length < 3 || idFiles.some((x) => !x || !x.type.startsWith("image/"))) return toast("Please choose an image for the ID front, ID back, and selfie.");
    toast("Uploading your documents...");
    try {
      const [front, back, selfie] = await Promise.all(idFiles.map((x) => compressImage(x, 2200, .9)));
      u.idDocs = { type: idType, front, back, selfie, submittedAt: new Date().toISOString() };
      u.v.id = "review"; u.v.selfie = "review";
      if (!await save()) return;
      toast("Your ID photos were submitted for review.");
      go("#/verification");
    } catch (err) { toast("Could not read one of the images. Please try another file."); }
  }
  else if (k === "papers") { u.v.papers = "review"; save(); toast("Equipment submitted for review."); go("#/verification"); }
  else if (k === "book") {
    if (new Date(d.end) <= new Date(d.start)) return toast("End date must be after the start date.");
    const conflict = db.bookings.some((b) => Number(b.eq) === Number(draft.eq) && ["pending", "approved"].includes(b.status) && d.start < b.end && d.end > b.start);
    const blocked = db.availability.some((x) => Number(x.eq) === Number(draft.eq) && d.start <= x.end && d.end > x.start);
    if (conflict || blocked) return toast("Those dates are unavailable. Please choose another date range.");
    draft = { ...draft, ...d }; go("#/confirm/" + draft.eq);
  }
  else if (k === "confirm") {
    if (!draft) return toast("Your booking details expired. Please select the equipment and dates again.");
    const e2 = E(draft.eq), days = Math.max(1, Math.round((new Date(draft.end) - new Date(draft.start)) / 864e5));
    const ref = "AR-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-7);
    const gcashDemo = d.pay === "GCash";
    if (!d.pay) return toast("Please choose a payment method.");
    if (!e2 || (e2.status && e2.status !== "approved")) return toast("This equipment is not approved for booking yet.");
    const booking = { ref, eq: e2.id, equipmentName: e2.name, renter: u.email, owner: e2.owner, start: draft.start, end: draft.end, days, total: Number(e2.price) * days, status: "pending", delivery: draft.delivery, addr: draft.addr, pay: d.pay, paymentStatus: gcashDemo ? "awaiting_payment_demo" : "pay_on_delivery", createdAt: new Date().toISOString() };
    // Payment selection changes payment fields/status only; equipment and rental dates are not modified.
    db.bookings.push(booking); save(); draft = null;
    if (gcashDemo) {
      try {
        await persistState();
        window.location.href = `AgriRenta_GCash_Payment_Neumorphism_Green.html?reference=${encodeURIComponent(ref)}&amount=${encodeURIComponent(booking.total)}`;
        return;
      } catch (err) {
        toast(err.message || "Could not save the booking. Please try again.");
        go("#/submitted/" + ref); return;
      }
    }
    save(); go("#/submitted/" + ref);
  } else if (k === "review") {
    const b = db.bookings.find((x) => x.ref === f.dataset.ref), owner = u.role === "owner";
    if (!b || b.status !== "returned" || (owner ? b.owner !== u.email : b.renter !== u.email)) return toast("Only a participant in a returned rental can submit this review.");
    if (!isVerified(u)) return toast("Verify your account before submitting a rating.");
    const target = owner ? b.renter : b.owner;
    const reviewData = { type: "rental", bookingRef: b.ref, to: target, from: u.email, stars: rate.stars, text: (rate.tags.join(", ") + (d.text ? ". " + d.text : "")).trim(), date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) };
    const existing = db.reviews.find(x => x.type !== "admin" && x.bookingRef === b.ref && x.from === u.email && x.to === target);
    if (existing) Object.assign(existing, reviewData); else db.reviews.push(reviewData);
    b[owner ? "ratedRenter" : "ratedOwner"] = true; rate = { stars: 4, tags: [] }; save(); toast("Thanks for your review!"); go(owner ? "#/dashboard" : "#/bookings");
  } else if (k === "addeq") { db.eq.push({ id: Date.now(), name: d.name, spec: d.spec || "", cat: d.cat, img: d.cat === "Tractors" ? "tractor" : d.cat === "Harvesters" ? "harvester" : d.cat === "Tillers" ? "tiller" : "pump", price: +d.price, rating: 0, n: 0, owner: u.email, location: d.location || LOCATIONS[0], status: "pending" }); save(); toast("Listing added to your demo listings."); rerender(); }
  else if (k === "blockdates") { if (d.end < d.start) return toast("End date must be on or after the start date."); const owns = db.eq.some((x) => String(x.id) === String(d.eq) && x.owner === u.email); if (!owns) return toast("Choose your own equipment."); const conflict = db.availability.some((x) => String(x.eq) === String(d.eq) && d.start <= x.end && d.end >= x.start); if (conflict) return toast("These dates overlap an existing blocked period."); db.availability.push({ id: Date.now(), eq: Number(d.eq), owner: u.email, start: d.start, end: d.end, reason: d.reason || "" }); save(); toast("Unavailable dates saved."); rerender(); }
});
async function initAgriRenta() {
  try {
    const response = await fetch("/api/state", { credentials:"same-origin", headers:{"Accept":"application/json"} });
    if (response.ok) {
      const result = await response.json();
      if (result && result.ok) {
        serverApiEnabled = true;
        let serverState = result.state;
        rolePending = !!(serverState && serverState.rolePending);
        if (!serverState || typeof serverState !== "object") {
          const seeded = await fetch("/api/bootstrap", { method:"POST", credentials:"same-origin", headers:{"Content-Type":"application/json"}, body:JSON.stringify({state:db}) });
          const initial = await seeded.json();
          if (!seeded.ok || !initial.ok || !initial.state) throw new Error(initial.error || "Could not initialize the database.");
          serverState = initial.state;
        }
        const pending = serverState.me ? readPendingState() : null;
        if (pending?.me === serverState.me) {
          demoCatalogChanged = normalizeState(pending);
          db.me = serverState.me;
          await save();
        } else {
          demoCatalogChanged = normalizeState(serverState);
          db.me = serverState.me || null;
          if (demoCatalogChanged && db.me) await save();
          else localStorage.setItem("agri", JSON.stringify(db));
        }
      }
    }
  } catch (err) {
    console.info("AgriRenta API not available; using local demo storage. Check supabase-config.js to enable Supabase persistence.");
  }
  const params = new URLSearchParams(location.search);
  const requestedEquipment = params.get("book");
  if (requestedEquipment) sessionStorage.setItem("agri_book_after_login", requestedEquipment);
  const gcashDemoReturn = params.get("gcash");
  const gcashReference = params.get("reference");
  if (gcashDemoReturn === "complete" && gcashReference) {
    const booking = db.bookings.find(item => item.ref === gcashReference && item.renter === db.me);
    if (booking && booking.pay === "GCash" && booking.paymentStatus !== "paid") {
      try {
        if (serverApiEnabled) {
          const response = await fetch("/api/payment/gcash-demo-complete", { method:"POST", credentials:"same-origin", headers:{"Content-Type":"application/json"}, body:JSON.stringify({reference:gcashReference}) });
          const result = await response.json();
          if (!response.ok || !result.ok) throw new Error(result.error || "Could not update GCash demo status.");
        }
        booking.paymentStatus = "demo_completed";
        await persistState();
      } catch (err) {
        console.warn("Could not save GCash demo status.", err);
      }
    }
    history.replaceState({}, document.title, location.pathname + location.hash);
    go("#/submitted/" + encodeURIComponent(gcashReference));
  }
  render();
}
initAgriRenta();
