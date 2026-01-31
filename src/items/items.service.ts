import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Item } from './entities/item.entity';

@Injectable()
export class ItemsService {
  private items: Item[] = [];
  private idCounter = 1;

  create(createItemDto: CreateItemDto): Item {
    const newItem: Item = {
      id: this.idCounter++,
      ...createItemDto,
      quantity: createItemDto.quantity ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items.push(newItem);
    return newItem;
  }

  findAll(): Item[] {
    return this.items;
  }

  findOne(id: number): Item {
    const item = this.items.find((item) => item.id === id);
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return item;
  }

  update(id: number, updateItemDto: UpdateItemDto): Item {
    const itemIndex = this.items.findIndex((item) => item.id === id);
    if (itemIndex === -1) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    const updatedItem: Item = {
      ...this.items[itemIndex],
      ...updateItemDto,
      updatedAt: new Date(),
    };
    this.items[itemIndex] = updatedItem;
    return updatedItem;
  }

  remove(id: number): void {
    const itemIndex = this.items.findIndex((item) => item.id === id);
    if (itemIndex === -1) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    this.items.splice(itemIndex, 1);
  }
}
