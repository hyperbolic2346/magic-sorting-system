# Tick function for sorting system
scoreboard players add #hc_tick hc_tick 1
execute if score #hc_tick hc_tick matches 1 run function mss:second
execute if score #hc_tick hc_tick matches 100.. run scoreboard players set #hc_tick hc_tick 0
