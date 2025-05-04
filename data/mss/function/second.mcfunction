# Called every second to trigger sorting
execute as @e[type=minecraft:item,nbt={OnGround:1b}] at @s if block ~ ~-1 ~ minecraft:lapis_block if block ~ ~-2 ~ minecraft:gold_block run function mss:sort
