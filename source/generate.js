#!/usr/bin/env node

// Magic Sorting System
// (c) 2018 - 2020 Joseph Huckaby, MIT License
// Minecraft Data Pack Function Generator
// Reads item sorting info from config.json and generates all .mcfunction files
// Usage: node generate.js

const fs = require('fs');
const Path = require('path');
const config = require(Path.join(__dirname, 'config.json'));

process.chdir(__dirname);
const func_dir = Path.resolve("../data/mss/function");
const tags_dir = Path.resolve("../data/minecraft/tags/function");
const sort_func_file = Path.join(func_dir, "sort.mcfunction");
const group_names = config.groups.map(function(group) { return group.group_name; });

// Ensure directories exist
fs.mkdirSync(func_dir, { recursive: true });
fs.mkdirSync(tags_dir, { recursive: true });

// Start generating main sort.mcfunction code
const sort_lines = [
    "# Magic Sorting System v2.0 -- Sort Single Item",
    "# Expects input @s from previous execute / run",
    "# " + group_names.length + " Groups: " + group_names.join(', '),
    ""
];

// Add optional sound/particle effects on teleport
if (config.effects) {
    config.effects.forEach(function(effect) {
        sort_lines.push("execute at @s unless score #mss_cooldown mss_cooldown matches 1 run " + effect);
    });
}

// Set cooldown flag
sort_lines.push(
    "scoreboard players set #mss_cooldown mss_cooldown 1",
    ""
);

console.log("Magic Sorting System -- Code Generator v2.0");
console.log("");

let total_items = 0;
const all_item_ids = {};
const all_group_ids = {};
const all_item_frame_ids = {};

function write_sort_file(filename, fallback_action, target, name) {
    let name_selector = "";
    if (name) {
        // Use double quotes and proper escaping for 1.20+ NBT syntax
        name_selector = ',components:{"minecraft:custom_name":\'"' + name + '"\'}';
    }

    const entity_match_selector = '@e[type=minecraft:item_frame,nbt={Item:{id:"' + target + '"' + name_selector + '}},distance=..128]';
    const entity_dest_selector = '@e[limit=1,sort=nearest,type=minecraft:item_frame,nbt={Item:{id:"' + target + '"' + name_selector + '}},distance=..128]';

    // Create special sort mcfunction for group
    fs.writeFileSync(filename,
        'execute as @s if entity ' + entity_match_selector + ' run teleport @s ' + entity_dest_selector + '\n' +
        'execute as @s unless entity ' + entity_match_selector + ' run ' + fallback_action + '\n'
    );
    console.log("Wrote file: " + Path.relative(__dirname, filename));
}

config.groups.forEach(function(group) {
    const group_id = group.group_name.replace(/\W+/g, '');
    const items = group.items;
    const target = group.item_frame;

    if (group_id in all_group_ids) {
        console.error("ERROR: Duplicate Group ID: " + group_id);
        return;
    }
    all_group_ids[group_id] = 1;

    if (target in all_item_frame_ids) {
        console.error("ERROR: Duplicate Item Frame ID: " + target);
        return;
    }
    all_item_frame_ids[target] = 1;

    if (items && items.length && target) {
        const group_func_file = Path.join(func_dir, "sort_" + group_id + ".mcfunction");
        const group_fallback = group.fallback ? ('function mss:sort_' + group.fallback) : config.final_fallback;
        write_sort_file(group_func_file, group_fallback, target, config.group_name_in_frame);

        // Add group's items to main sort routine
        items.forEach(function(item_id, idx) {
            const item_name = item_id.split(":")[1];
            const item_func_file = Path.join(func_dir, "sort_item_" + item_name + ".mcfunction");
            write_sort_file(item_func_file, 'function mss:sort_' + group_id, item_id, config.item_name_in_frame);

            if (item_id in all_item_ids) {
                console.error("ERROR: Duplicate Item ID: " + item_id);
            }
            all_item_ids[item_id] = 1;

            sort_lines.push(
                'execute as @s if entity @s[type=item,nbt={Item:{id:"' + item_id + '"}}] run function mss:sort_item_' + item_name
            );
            total_items++;
        });
    }
    else {
        console.error("ERROR: Invalid group, skipping: " + group_id);
    }
});

fs.writeFileSync(sort_func_file, sort_lines.join("\n") + "\n");
console.log("Wrote file: " + Path.relative(__dirname, sort_func_file));

// Generate init.mcfunction
fs.writeFileSync(Path.join(func_dir, "init.mcfunction"), [
    "# Initialize sorting system",
    "scoreboard objectives add hc_tick dummy",
    "scoreboard objectives add mss_cooldown dummy",
    "scoreboard players set #hc_tick hc_tick 0",
    "scoreboard players set #mss_cooldown mss_cooldown 0"
].join("\n") + "\n");
console.log("Wrote file: " + Path.relative(__dirname, Path.join(func_dir, "init.mcfunction")));

// Generate tick.mcfunction
fs.writeFileSync(Path.join(func_dir, "tick.mcfunction"), [
    "# Tick function for sorting system",
    "scoreboard players add #hc_tick hc_tick 1",
    "execute if score #hc_tick hc_tick matches 1 run function mss:second",
    "execute if score #hc_tick hc_tick matches 100.. run scoreboard players set #hc_tick hc_tick 0"
].join("\n") + "\n");
console.log("Wrote file: " + Path.relative(__dirname, Path.join(func_dir, "tick.mcfunction")));

// Generate second.mcfunction
fs.writeFileSync(Path.join(func_dir, "second.mcfunction"), [
    "# Called every second to trigger sorting",
    "execute as @e[type=minecraft:item,nbt={OnGround:1b}] at @s if block ~ ~-1 ~ minecraft:lapis_block if block ~ ~-2 ~ minecraft:gold_block run function mss:sort"
].join("\n") + "\n");
console.log("Wrote file: " + Path.relative(__dirname, Path.join(func_dir, "second.mcfunction")));

// Generate pack.mcmeta for 1.21
const packMcmeta = {
    pack: {
        pack_format: 48,
        description: 'Magic Sorting System with Individual Sorting and Named Frames for Minecraft 1.21'
    }
};
fs.writeFileSync(Path.join('..', 'pack.mcmeta'), JSON.stringify(packMcmeta, null, 2));
console.log("Wrote file: " + Path.relative(__dirname, Path.join('..', 'pack.mcmeta')));

// Generate function tags
const tickTag = {
    values: ['main:tick']
};
fs.writeFileSync(Path.join(tags_dir, 'tick.json'), JSON.stringify(tickTag, null, 2));
console.log("Wrote file: " + Path.relative(__dirname, Path.join(tags_dir, 'tick.json')));

const loadTag = {
    values: ['main:init']
};
fs.writeFileSync(Path.join(tags_dir, 'load.json'), JSON.stringify(loadTag, null, 2));
console.log("Wrote file: " + Path.relative(__dirname, Path.join(tags_dir, 'load.json')));

console.log("");
console.log(total_items + " total items sorted.");
console.log(group_names.length + " sort groups created: " + group_names.join(', '));
console.log("");
console.log("Complete!");