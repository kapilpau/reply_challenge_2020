const fs = require("fs");

const args = process.argv.slice(2);

let devs = [];
let mgrs = [];

let MAP = []; // Will be an Array of Arrays (2D Array effectively)
let DEV_SPACES = [];
let MAN_SPACES = [];
let ALLOCATIONS = [];
let C, R;

let SCORE_BOARD = [];

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
        let devObj = {
            company: dev[0],
            bonus: dev[1],
            skills: dev.splice(3),
            id: `D${i - 1}`,
            positionX: Number.MIN_SAFE_INTEGER,
            positionY: Number.MIN_SAFE_INTEGER,
        };
        devs.push(devObj)
    }

    for (let i = 0; i<devs.length-1; i++) {
        let dev1 = devs[i];
        for (let j = i+1; j<devs.length; j++) {
            let dev2 = devs[j];
            SCORE_BOARD.push({
                person1: dev1.id,
                person2: dev2.id,
                score: getTP(dev1, dev2)
            })
        }
    }

    line_pointer = Number(lines[line_pointer]) + line_pointer + 1;


    for(let i = 1; i<=Number(lines[line_pointer]); i++) {
        let mgr = lines[line_pointer + i].split(" ");
        let mgrObj = {
            company: mgr[0],
            bonus: mgr[1],
            id: `M${i - 1}`,
            positionX: Number.MIN_SAFE_INTEGER,
            positionY: Number.MIN_SAFE_INTEGER,
        };
        mgrs.push(mgrObj);
    }

    for (let i = 0; i<mgrs.length-1; i++) {
        let mgr1 = mgrs[i];
        for (let j = i+1; j<mgrs.length; j++) {
            let mgr2 = mgrs[j];
            SCORE_BOARD.push({
                person1: mgr1.id,
                person2: mgr2.id,
                score: getTP(mgr1, mgr2)
            })
        }
    }

    for (let i = 0; i<devs.length-1; i++) {
        let dev = devs[i];
        for (let j = 0; j < mgrs.length; j++){
            let mgr = mgrs[j];
            SCORE_BOARD.push({
                person1: dev.id,
                person2: mgr.id,
                score: getTP(dev, mgr)
            })
        }
    }


    SCORE_BOARD = SCORE_BOARD.sort((a, b) => b.score - a.score);

    const logger = fs.createWriteStream('out.txt', {
        flags: 'a'
    });


    devs.forEach(dev => logger.write(dev.positionX > -1 && dev.positionY > -1 ? `${dev.positionX} ${dev.positionY}` : "X" + "\r\n"));
    mgrs.forEach(mgr => logger.write(mgr.positionX > -1 && mgr.positionY > -1 ? `${mgr.positionX} ${mgr.positionY}` : "X" + "\r\n"));
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
    // console.log(r);
    // console.log(c);
    let map = [];

    for(let i = 0; i < r; i++){
        map[i] = new Array(c);
        for(let j = 0; j < c; j++){
            let c = lines[i + 1].charAt(j);
            if(c === '_')
                DEV_SPACES.push([i, j]);
            else if(c === 'M')
                MAN_SPACES.push([i, j]);
            map[i][j] = c;
        }
    }

    console.log(map);
    console.log("MAN_SPACES = ", MAN_SPACES);
    console.log("DEV_SPACES = ", DEV_SPACES);
    return map;
}

allocate();

function allocate(){
    let MAX_I = Math.max(MAN_SPACES.length, DEV_SPACES.length);
    let greater_arr = MAN_SPACES.length > DEV_SPACES.length ? MAN_SPACES : DEV_SPACES;
    let MIN_J = Math.min(MAN_SPACES.length, DEV_SPACES.length);
    let lesser_arr = MAN_SPACES.length < DEV_SPACES.length ? MAN_SPACES : DEV_SPACES;

    // TODO seated

    // All devs
    for(let i = 0; i < DEV_SPACES.length; i++){
        let coords1 = DEV_SPACES[i];

        // Find DEV SPACES
        for (let ds = 0; ds < DEV_SPACES.length; ds++){
            if(ds === i)
                continue;
            let coords2 = DEV_SPACES[ds];
            if(is_adjacent(coords1, coords2)){
                for (let ss = 0; ss < SCORE_BOARD.length; ss++){
                    let data = SCORE_BOARD[ss];
                    // NOTE: Contains only works for strings after JS2016. Else use indexOf()
                    if(!data.used && data.person1.includes('D') && data.person2.includes('D')){
                        data['used'] = true;
                        data['p1'] = coords1;
                        data['p2'] = coords2;
                        break;
                    }
                }
            }
        }

        // Find MAN SPACES
        for (let ds = 0; ds < MAN_SPACES.length; ds++){
            let coords2 = MAN_SPACES[ds];
            if(is_adjacent(coords1, coords2)){
                for (let ss = 0; ss < SCORE_BOARD.length; ss++){
                    let data = SCORE_BOARD[ss];
                    // NOTE: Contains only works for strings after JS2016. Else use indexOf()
                    if(!data.used && data.person1.includes('D') && data.person2.includes('M')){
                        data['used'] = true;
                        data['p1'] = coords1;
                        data['p2'] = coords2;
                        break;
                    }
                }
            }
        }
    }

    // All mans
    for(let i = 0; i < MAN_SPACES.length; i++){
        let coords1 = MAN_SPACES[i];

        // Find DEV SPACES
        for (let ds = 0; ds < DEV_SPACES.length; ds++){
            if(ds === i)
                continue;
            let coords2 = DEV_SPACES[ds];
            if(is_adjacent(coords1, coords2)){
                for (let ss = 0; ss < SCORE_BOARD.length; ss++){
                    let data = SCORE_BOARD[ss];
                    // NOTE: Contains only works for strings after JS2016. Else use indexOf()
                    if(!data.used && data.person1.includes('M') && data.person2.includes('D')){
                        data['used'] = true;
                        data['p1'] = coords1;
                        data['p2'] = coords2;
                        break;
                    }
                }
            }
        }

        // Find MAN SPACES
        for (let ds = 0; ds < MAN_SPACES.length; ds++){
            let coords2 = MAN_SPACES[ds];
            if(is_adjacent(coords1, coords2)){
                for (let ss = 0; ss < SCORE_BOARD.length; ss++){
                    let data = SCORE_BOARD[ss];
                    // NOTE: Contains only works for strings after JS2016. Else use indexOf()
                    if(!data.used && data.person1.includes('M') && data.person2.includes('M')){
                        data['used'] = true;
                        data['p1'] = coords1;
                        data['p2'] = coords2;
                        break;
                    }
                }
            }
        }
    }


    console.log(SCORE_BOARD);
    // console.log(is_adjacent(MAN_SPACES[0], DEV_SPACES[0])); // true
    // console.log(is_adjacent(MAN_SPACES[1], DEV_SPACES[1])); // false
    // console.log(is_adjacent(MAN_SPACES[1], DEV_SPACES[2])); // true
}

function allocate_place(coord) {
    // All devs
    for(let i = 0; i < DEV_SPACES.length; i++){
        let coords1 = DEV_SPACES[i];

        // Find DEV SPACES
        for (let ds = 0; ds < DEV_SPACES.length; ds++){
            if(ds === i)
                continue;
            let coords2 = DEV_SPACES[ds];
            if(is_adjacent(coords1, coords2)){
                for (let ss = 0; ss < SCORE_BOARD.length; ss++){
                    let data = SCORE_BOARD[ss];
                    // NOTE: Contains only works for strings after JS2016. Else use indexOf()
                    if(!data.used && data.person1.includes('D') && data.person2.includes('D')){
                        data['used'] = true;
                        data['p1'] = coords1;
                        data['p2'] = coords2;
                        break;
                    }
                }
            }
        }

        // Find MAN SPACES
        for (let ds = 0; ds < MAN_SPACES.length; ds++){
            let coords2 = MAN_SPACES[ds];
            if(is_adjacent(coords1, coords2)){
                for (let ss = 0; ss < SCORE_BOARD.length; ss++){
                    let data = SCORE_BOARD[ss];
                    // NOTE: Contains only works for strings after JS2016. Else use indexOf()
                    if(!data.used && data.person1.includes('D') && data.person2.includes('M')){
                        data['used'] = true;
                        data['p1'] = coords1;
                        data['p2'] = coords2;
                        break;
                    }
                }
            }
        }
    }
}

function is_valid(x, y) {
    return (x => 0 && x < R && y >= 0 && y < C);
}

function is_adjacent(coords1, coords2) {
    let [[x1, y1], [x2, y2]] = [coords1, coords2] ;
    if(is_valid(x2, y2 + 1) && x2 === x1 && (y2 + 1) === y1)
        return true;
    else if(is_valid(x2, y2 - 1) && x2 === x1 && (y2 - 1) === y1)
        return true;
    else if(is_valid(x2 + 1, y2) && (x2 + 1) === x1 && y2 === y1)
        return true;
    else if(is_valid(x2 - 1, y2) && (x2 - 1) === x1 && y2 === y1)
        return true;

    return false;
}


// HELPERS //

Object.isEqual = function (obj1, obj2) { // try optimise if becomes a bottleneck
    // Short-circuit: Try shallow comparison first
    if(obj1 === obj2)
        return true;

    // Loop through properties in object 1
    for (let p in obj1) {
        // Check property exists on both objects
        if (obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)) return false;

        switch (typeof (obj1[p])) {
            // Deep compare objects
            case 'object':
                if (!Object.compare(obj1[p], obj2[p])) return false;
                break;
            // Compare function code
            case 'function':
                if (typeof (obj2[p]) == 'undefined' || (p !== 'compare' && obj1[p].toString() !== obj2[p].toString())) return false;
                break;
            // Compare values
            default:
                if (obj1[p] !== obj2[p]) return false;
        }
    }

    // Check object 2 for any extra properties
    for (let p in obj2) {
        if (typeof (obj1[p]) == 'undefined') return false;
    }
    return true;
};