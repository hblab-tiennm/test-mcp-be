import { ApiProperty } from '@nestjs/swagger';

export class Item {
  @ApiProperty({ description: 'Unique identifier', example: 1 })
  id: number;

  @ApiProperty({ description: 'Name of the item', example: 'Sample Item' })
  name: string;

  @ApiProperty({
    description: 'Description of the item',
    example: 'This is a sample item',
    required: false,
  })
  description?: string;

  @ApiProperty({ description: 'Price of the item', example: 100 })
  price: number;

  @ApiProperty({ description: 'Quantity in stock', example: 10 })
  quantity: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
