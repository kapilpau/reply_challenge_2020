const fs = require("fs");

const args = process.argv.slice(2);

let devs = [];
let mgrs = [];

let MAP = []; // Will be an Array of Arrays (2D Array effectively)

try {
    // read contents of the file
    const data = fs.readFileSync(args[0], 'UTF-8');

    // split the contents by new line
    const lines = data.split(/\r?\n/);

    let line_pointer = Number(lines[0].split(" ")[1]) + 1;

    let C = lines[0].split(" ")[0];
    let R = lines[0].split(" ")[1];

    MAP = create_map(R, C, lines);

    for(let i = 1; i<=Number(lines[line_pointer]); i++) {
        let dev = lines[line_pointer + i].split(" ");
        devs.push({
            company: dev[0],
            bonus: dev[1],
            skills: dev.splice(3),
            type: 'D',
            id: i - 1,
            position: "X"
        })
    }

    line_pointer = Number(lines[line_pointer]) + line_pointer + 1;


    for(let i = 1; i<=Number(lines[line_pointer]); i++) {
        let mgr = lines[line_pointer + i].split(" ");
        mgrs.push({
            company: mgr[0],
            bonus: mgr[1],
            type: 'M',
            id: i - 1,
            position: "X"
        });
    }


    const logger = fs.createWriteStream('out.txt', {
        flags: 'a'
    });

    console.log(getTP(devs[0], mgrs[0]))

    devs.forEach(dev => logger.write(dev.position + "\r\n"));
    mgrs.forEach(mgr => logger.write(mgr.position + "\r\n"));
} catch (err) {
    console.error(err);
}

function getWP(dev1, dev2) {
    if (!(dev1.type === "D" && dev2.type === "D"))
        return 0;
    let totalJointSkillScore = dev1.skills.length + dev2.skills.length;
    let totalDistinctSkillScore = dev1.skills.length + dev2.skills.length;

    dev1.skills.forEach(skill => {
        if (dev2.skills.indexOf(skill) > -1) {
            totalDistinctSkillScore -= 2
        }
    });

    return totalDistinctSkillScore * totalJointSkillScore;
}

function getBP(person1, person2) {
    return person1.company === person2.company ? person1.bonus * person2.bonus : 0
}

function getTP(person1, person2) {
    return (person1.skills && person2.skills ? getWP(person1, person2) : 0) + getBP(person1, person2)
}

function create_map(r, c, lines){
    let map = [];

    for(let i = 0; i < r; i++){
        map[i] = new Array(c);
        for(let j = 0; j < c; j++){
            map[i][j] = lines[i + 1].charAt(j);
        }
    }

    console.log(map);
    console.log("MAP(0,0) = ", map[0][0]);
    return map;
}