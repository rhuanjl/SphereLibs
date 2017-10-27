import {convertRSS} from "./src/rssLoader";
import {convertRMP} from "./src/rmpLoader";

Object.assign(Sphere.Game, {
	name: "Kefka's Revenge 2.0",
	author: "rhuan",
	summary: "A remake of Kefka's revenue made by Whizz and ... FILL THIS IN LATER",
	resolution: "640x480",
	saveID: "testing",
	main: "@/bin/main.mjs"
});

var rssTool = new Tool(convertRSS, "converting RSS");
var rmpTool = new Tool(convertRMP, "converting RMP");


function runTool(dirName, sources, tool, extension)
{
	let targets = [];
	FS.createDirectory(dirName);
	for (const source of sources)
	{
		let fileName = FS.fullPath(source.name, dirName);
		fileName = fileName.substring(0, fileName.lastIndexOf(".")) + extension;
		let target = tool.stage(fileName, [source], {
			name: source.name,
		});
		targets.push(target);
	}
	return targets;
}



runTool("@/sprites", files("spritesets/*.rss"), rssTool, ".ses");
runTool("@/maps", files("maps/*.rmp"), rmpTool, ".mem");

install("@/maps/scripts", files("src/mapScripts/*.mjs"));
install("@/bin", files("src/*.mjs"));
//install("@/bin", files("src/*.js"));
install("@/shaders",  files("shaders/*.glsl", true));
install("@/windows",  files("windowstyles/*.rws", true));