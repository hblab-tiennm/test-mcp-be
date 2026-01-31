import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class CreateItemDto {
  @ApiProperty({ description: 'Name of the item', example: 'Sample Item' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the item',
    example: 'This is a sample item',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Price of the item', example: 100 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Quantity in stock', example: 10, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;
}
