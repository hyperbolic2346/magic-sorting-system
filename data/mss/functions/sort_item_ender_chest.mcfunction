execute as @s if entity @e[type=minecraft:item_frame,nbt={Item:{id:"minecraft:ender_chest",tag:{display:{Name:'{"text":"sorter"}'}}}},distance=0..128] run teleport @s @e[limit=1,sort=random,type=minecraft:item_frame,nbt={Item:{id:"minecraft:ender_chest",tag:{display:{Name:'{"text":"sorter"}'}}}},distance=0..128]
execute as @s unless entity @e[type=minecraft:item_frame,nbt={Item:{id:"minecraft:ender_chest",tag:{display:{Name:'{"text":"sorter"}'}}}},distance=0..128] run function mss:sort_storage
